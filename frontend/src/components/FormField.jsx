/**
 * Komponen FormField Reusable (Input, Select, Textarea)
 * Mendukung validasi real-time, pesan error, petunjuk (hint), dan atribut readOnly/disabled.
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  options = [],
  placeholder = '',
  required = false,
  disabled = false,
  readOnly = false,
  error = '',
  hint = '',
  fullWidth = false,
  min,
  max,
  step,
  maxLength,
  rows = 3,
}) {
  const controlClass = `form-control ${error ? 'has-error' : ''}`.trim()

  return (
    <div className={`form-field ${fullWidth ? 'full-width' : ''}`.trim()}>
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="form-required">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled || readOnly}
          required={required}
          className={controlClass}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={controlClass}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          className={controlClass}
        />
      )}

      {error ? (
        <span className="form-error">{error}</span>
      ) : hint ? (
        <span className="form-hint">{hint}</span>
      ) : null}
    </div>
  )
}
