# frozen_string_literal: true

module Admin
  class VariationPresetsController < BaseController
    before_action :set_preset, only: %i[edit update destroy]

    def index
      @presets = VariationPreset.order(:sort_order, :name)
    end

    def new
      @preset = VariationPreset.new(active: true, required: true, options_json: "[]")
    end

    def create
      @preset = VariationPreset.new(preset_params)

      if @preset.save
        redirect_to admin_variation_presets_path, notice: "Preset criado."
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit; end

    def update
      if @preset.update(preset_params)
        redirect_to admin_variation_presets_path, notice: "Preset atualizado."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @preset.destroy!
      redirect_to admin_variation_presets_path, notice: "Preset excluído."
    end

    private

    def set_preset
      @preset = VariationPreset.find(params[:id])
    end

    def preset_params
      params.require(:variation_preset).permit(
        :name, :unit, :required, :allow_option_image, :options_json, :sort_order, :active
      )
    end
  end
end
