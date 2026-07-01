module ApplicationHelper
  def lucide_icon(name, size: 18, **options)
    classes = [ options.delete(:class) ].compact.join(" ")

    attrs = {
      "data-lucide": name,
      width: size,
      height: size,
      stroke_width: 2,
      aria: { hidden: true }
    }
    attrs[:class] = classes if classes.present?

    tag.i(**options.merge(attrs))
  end



  def admin_nav_link_to(label, path, icon: nil, exact: false, sub: false)
    active = admin_nav_active?(path, exact:)

    classes = [ "admin-nav-link" ]

    classes << "admin-nav-link--sub" if sub

    classes << "is-active" if active

    options = { class: classes.join(" ") }

    options[:aria] = { current: "page" } if active



    link_to path, options do
      if icon

        concat lucide_icon(icon, class: "admin-nav-link__icon")

      else

        concat tag.span("", class: "admin-nav-link__mark", aria: { hidden: true })

      end

      concat tag.span(label, class: "admin-nav-link__label")
    end
  end



  def admin_nav_active?(path, exact: false)
    current_path = request.path

    target_path = path.to_s



    if exact

      current_path == target_path

    else

      current_path == target_path || current_path.start_with?("#{target_path}/")

    end
  end



  def admin_trade_status_badge(status)
    css = case status.to_s

    when "confirmed" then "is-success"

    when "pending" then "is-warning"

    when "cancelled", "reversed" then "is-danger"

    else "is-muted"

    end



    label = I18n.t("trade_order.status.#{status}", default: status.to_s.humanize)



    tag.span(label, class: "admin-status-badge #{css}")
  end



  def admin_announcement_status_badge(status)
    css = status.to_s == "published" ? "is-success" : "is-muted"

    tag.span(status.to_s.humanize, class: "admin-status-badge #{css}")
  end



  def admin_tag_swatch(color, label: nil)
    tag.span(class: "admin-tag-swatch") do
      safe_join([

        tag.i(style: "background:#{color.presence || '#dfe4e8'}'", aria: { hidden: true }),

        (label || color).to_s

      ])
    end
  end



  def admin_form_errors(record)
    return if record.errors.none?



    tag.div(class: "admin-form-errors", role: "alert") do
      record.errors.full_messages.to_sentence
    end
  end
end
