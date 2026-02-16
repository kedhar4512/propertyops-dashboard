
# Rails template for PropertyOps API (Rails 7+ API mode)
# Creates models, controllers, routes, seeds, and minimal docs.

say "Adding gems..."
append_to_file "Gemfile", <<~GEMS

  gem "rack-cors"
GEMS

say "Configuring CORS..."
inject_into_file "config/initializers/cors.rb", after: "# Be sure to restart your server when you modify this file.\n" do
<<~RUBY

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173"
    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head]
  end
end
RUBY
end

say "Generating models..."
generate "model Tenant first_name:string last_name:string email:string phone:string status:string"
generate "model Unit property_name:string unit_number:string beds:integer baths:decimal rent_cents:integer status:string"
generate "model MaintenanceRequest tenant:references unit:references title:string description:text status:string priority:string"
generate "model Payment tenant:references unit:references amount_cents:integer paid_on:date method:string reference:string"

say "Adding model validations/relations..."
tenant_model = <<~RUBY
class Tenant < ApplicationRecord
  has_many :maintenance_requests, dependent: :destroy
  has_many :payments, dependent: :destroy

  validates :first_name, :last_name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[active inactive applicant], message: "must be active, inactive, or applicant" }, allow_nil: true
end
RUBY
remove_file "app/models/tenant.rb"
create_file "app/models/tenant.rb", tenant_model

unit_model = <<~RUBY
class Unit < ApplicationRecord
  has_many :maintenance_requests, dependent: :destroy
  has_many :payments, dependent: :destroy

  validates :property_name, :unit_number, presence: true
  validates :rent_cents, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :status, inclusion: { in: %w[occupied vacant maintenance], message: "must be occupied, vacant, or maintenance" }, allow_nil: true
end
RUBY
remove_file "app/models/unit.rb"
create_file "app/models/unit.rb", unit_model

mr_model = <<~RUBY
class MaintenanceRequest < ApplicationRecord
  belongs_to :tenant
  belongs_to :unit

  validates :title, :status, presence: true
  validates :status, inclusion: { in: %w[new in_progress resolved closed], message: "must be new, in_progress, resolved, or closed" }
  validates :priority, inclusion: { in: %w[low medium high urgent], message: "must be low, medium, high, or urgent" }, allow_nil: true
end
RUBY
remove_file "app/models/maintenance_request.rb"
create_file "app/models/maintenance_request.rb", mr_model

payment_model = <<~RUBY
class Payment < ApplicationRecord
  belongs_to :tenant
  belongs_to :unit

  validates :amount_cents, numericality: { greater_than: 0 }
  validates :paid_on, presence: true
  validates :method, inclusion: { in: %w[cash card ach check], message: "must be cash, card, ach, or check" }, allow_nil: true
end
RUBY
remove_file "app/models/payment.rb"
create_file "app/models/payment.rb", payment_model

say "Generating controllers..."
generate "controller api/tenants"
generate "controller api/units"
generate "controller api/maintenance_requests"
generate "controller api/payments"

say "Writing controllers..."
create_file "app/controllers/api/base_controller.rb", <<~RUBY
class Api::BaseController < ApplicationController
  protect_from_forgery with: :null_session

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "Not found" }, status: :not_found
  end

  private

  def render_validation_errors(record)
    render json: { error: "Validation failed", details: record.errors }, status: :unprocessable_entity
  end
end
RUBY

create_file "app/controllers/api/tenants_controller.rb", <<~RUBY
class Api::TenantsController < Api::BaseController
  def index
    tenants = Tenant.order(created_at: :desc)
    tenants = tenants.where("first_name LIKE ? OR last_name LIKE ? OR email LIKE ?", "%#{params[:q]}%", "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
    render json: tenants
  end

  def show
    render json: Tenant.find(params[:id])
  end

  def create
    tenant = Tenant.new(tenant_params)
    return render_validation_errors(tenant) unless tenant.save

    render json: tenant, status: :created
  end

  def update
    tenant = Tenant.find(params[:id])
    return render_validation_errors(tenant) unless tenant.update(tenant_params)

    render json: tenant
  end

  def destroy
    Tenant.find(params[:id]).destroy
    head :no_content
  end

  private

  def tenant_params
    params.require(:tenant).permit(:first_name, :last_name, :email, :phone, :status)
  end
end
RUBY

create_file "app/controllers/api/units_controller.rb", <<~RUBY
class Api::UnitsController < Api::BaseController
  def index
    units = Unit.order(created_at: :desc)
    units = units.where("property_name LIKE ? OR unit_number LIKE ?", "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
    render json: units
  end

  def show
    render json: Unit.find(params[:id])
  end

  def create
    unit = Unit.new(unit_params)
    return render_validation_errors(unit) unless unit.save

    render json: unit, status: :created
  end

  def update
    unit = Unit.find(params[:id])
    return render_validation_errors(unit) unless unit.update(unit_params)

    render json: unit
  end

  def destroy
    Unit.find(params[:id]).destroy
    head :no_content
  end

  private

  def unit_params
    params.require(:unit).permit(:property_name, :unit_number, :beds, :baths, :rent_cents, :status)
  end
end
RUBY

create_file "app/controllers/api/maintenance_requests_controller.rb", <<~RUBY
class Api::MaintenanceRequestsController < Api::BaseController
  def index
    scope = MaintenanceRequest.includes(:tenant, :unit).order(created_at: :desc)
    scope = scope.where(status: params[:status]) if params[:status].present?
    scope = scope.where(priority: params[:priority]) if params[:priority].present?

    render json: scope.as_json(include: [:tenant, :unit])
  end

  def show
    mr = MaintenanceRequest.includes(:tenant, :unit).find(params[:id])
    render json: mr.as_json(include: [:tenant, :unit])
  end

  def create
    mr = MaintenanceRequest.new(mr_params)
    mr.status ||= "new"
    return render_validation_errors(mr) unless mr.save

    render json: mr.as_json(include: [:tenant, :unit]), status: :created
  end

  def update
    mr = MaintenanceRequest.find(params[:id])
    return render_validation_errors(mr) unless mr.update(mr_params)

    render json: mr.as_json(include: [:tenant, :unit])
  end

  def destroy
    MaintenanceRequest.find(params[:id]).destroy
    head :no_content
  end

  private

  def mr_params
    params.require(:maintenance_request).permit(:tenant_id, :unit_id, :title, :description, :status, :priority)
  end
end
RUBY

create_file "app/controllers/api/payments_controller.rb", <<~RUBY
class Api::PaymentsController < Api::BaseController
  def index
    scope = Payment.includes(:tenant, :unit).order(paid_on: :desc)
    scope = scope.where(tenant_id: params[:tenant_id]) if params[:tenant_id].present?
    scope = scope.where(unit_id: params[:unit_id]) if params[:unit_id].present?

    render json: scope.as_json(include: [:tenant, :unit])
  end

  def create
    payment = Payment.new(payment_params)
    return render_validation_errors(payment) unless payment.save

    render json: payment.as_json(include: [:tenant, :unit]), status: :created
  end

  private

  def payment_params
    params.require(:payment).permit(:tenant_id, :unit_id, :amount_cents, :paid_on, :method, :reference)
  end
end
RUBY

say "Routes..."
route <<~RUBY
namespace :api do
  resources :tenants
  resources :units
  resources :maintenance_requests
  resources :payments, only: [:index, :create]
end
RUBY

say "Seeds..."
create_file "db/seeds.rb", <<~RUBY
Tenant.destroy_all
Unit.destroy_all
MaintenanceRequest.destroy_all
Payment.destroy_all

t1 = Tenant.create!(first_name: "Ava", last_name: "Patel", email: "ava.patel@example.com", phone: "555-0101", status: "active")
t2 = Tenant.create!(first_name: "Noah", last_name: "Kim", email: "noah.kim@example.com", phone: "555-0102", status: "active")
t3 = Tenant.create!(first_name: "Mia", last_name: "Lopez", email: "mia.lopez@example.com", phone: "555-0103", status: "applicant")

u1 = Unit.create!(property_name: "Maple Grove", unit_number: "2B", beds: 2, baths: 1.5, rent_cents: 215000, status: "occupied")
u2 = Unit.create!(property_name: "Maple Grove", unit_number: "5A", beds: 1, baths: 1.0, rent_cents: 175000, status: "vacant")
u3 = Unit.create!(property_name: "Oak Plaza", unit_number: "11C", beds: 3, baths: 2.0, rent_cents: 285000, status: "occupied")

MaintenanceRequest.create!(tenant: t1, unit: u1, title: "Leaky kitchen faucet", description: "Slow drip under the sink.", status: "new", priority: "medium")
MaintenanceRequest.create!(tenant: t2, unit: u3, title: "AC not cooling", description: "Air blows but not cold.", status: "in_progress", priority: "high")

Payment.create!(tenant: t1, unit: u1, amount_cents: 215000, paid_on: Date.today - 10, method: "ach", reference: "ACH-10422")
Payment.create!(tenant: t2, unit: u3, amount_cents: 285000, paid_on: Date.today - 8, method: "card", reference: "CC-88431")

puts "Seeded: #{Tenant.count} tenants, #{Unit.count} units, #{MaintenanceRequest.count} requests, #{Payment.count} payments"
RUBY

say "Done."
