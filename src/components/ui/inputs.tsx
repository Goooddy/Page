import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../Icon';
import { Avatar } from './core';

export type FieldState = 'default' | 'checking' | 'success' | 'error' | 'disabled';

type TextFieldProps = {
  label?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  helper?: ReactNode;
  counter?: string;
  state?: FieldState;
  type?: 'text' | 'password' | 'email' | 'tel' | 'number';
  reveal?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  inputMode?: 'text' | 'numeric' | 'email';
  onEnter?: () => void;
  style?: CSSProperties;
  trailing?: ReactNode;
};

export function TextField({ label, value, onChange, placeholder, helper, counter, state = 'default', type = 'text', reveal, autoFocus, maxLength, inputMode, onEnter, style, trailing }: TextFieldProps) {
  const [focus, setFocus] = useState(false);
  const [shown, setShown] = useState(false);
  const disabled = state === 'disabled';
  const cls = state === 'error' ? 'error' : state === 'success' ? 'success' : disabled ? 'disabled' : focus || state === 'checking' ? 'focus' : '';
  const helperCls = state === 'error' ? 'c-danger' : state === 'success' ? 'c-accent' : disabled ? 'c-disabled' : 'c-tertiary';
  return (
    <div className="field-wrap" style={style}>
      {label && <span className="t-label c-secondary">{label}</span>}
      <label className={`field ${cls}`}>
        <input
          value={value}
          type={type === 'password' && !shown ? 'password' : type === 'password' ? 'text' : type}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          maxLength={maxLength}
          inputMode={inputMode}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.(); }}
        />
        {state === 'checking' && <Icon name="CircleNotch" size={20} tone="secondary" spin />}
        {state === 'success' && <Icon name="CheckCircle" size={20} tone="accent" />}
        {state === 'error' && <Icon name="WarningCircle" size={20} tone="danger" />}
        {reveal && (
          <button type="button" onClick={() => setShown((s) => !s)} style={{ display: 'flex' }} aria-label={shown ? 'Hide password' : 'Show password'}>
            <Icon name={shown ? 'EyeSlash' : 'Eye'} size={20} tone="default" />
          </button>
        )}
        {trailing}
      </label>
      {(helper || counter) && (
        <div className="field-foot">
          <span className={`t-caption ${helperCls} grow`}>{helper}</span>
          {counter && <span className="t-caption c-tertiary">{counter}</span>}
        </div>
      )}
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder, helper, max, autoFocus, rows = 4 }: {
  label?: string; value: string; onChange?: (v: string) => void; placeholder?: string; helper?: string; max?: number; autoFocus?: boolean; rows?: number;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="field-wrap">
      {label && <span className="t-label c-secondary">{label}</span>}
      <label className={`field area ${focus ? 'focus' : ''}`}>
        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={max}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </label>
      {(helper || max) && (
        <div className="field-foot">
          <span className="t-caption c-tertiary grow">{helper}</span>
          {max && <span className="t-caption c-tertiary">{value.length} / {max}</span>}
        </div>
      )}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = 'Search a title', searching, autoFocus, onSubmit, style }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; searching?: boolean; autoFocus?: boolean; onSubmit?: () => void; style?: CSSProperties;
}) {
  const [focus, setFocus] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className={`field search ${focus ? 'focus' : ''}`} style={style}>
      <Icon name="MagnifyingGlass" size={20} tone="secondary" />
      <input
        ref={ref}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit?.(); }}
      />
      {searching ? (
        <Icon name="CircleNotch" size={20} tone="secondary" spin />
      ) : value ? (
        <button type="button" style={{ display: 'flex' }} onClick={() => { onChange?.(''); ref.current?.focus(); }} aria-label="Clear">
          <Icon name="XCircle" size={20} tone="secondary" />
        </button>
      ) : null}
    </label>
  );
}

export function SelectField({ label, value, placeholder, helper, onClick, disabled }: {
  label?: string; value?: string; placeholder: string; helper?: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <div className="field-wrap">
      {label && <span className="t-label c-secondary">{label}</span>}
      <button className={`field ${disabled ? 'disabled' : ''}`} onClick={onClick} disabled={disabled} style={{ width: '100%' }}>
        <span className={`t-body grow ${disabled ? 'c-disabled' : value ? 'c-primary' : 'c-tertiary'}`}>{value || placeholder}</span>
        <Icon name="CaretDown" size={20} tone={disabled ? 'disabled' : 'secondary'} />
      </button>
      {helper && <span className="t-caption c-tertiary">{helper}</span>}
    </div>
  );
}

/* ——— Message composer ——— */
export type ComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend?: () => void;
  placeholder?: string;
  sending?: boolean;
  disabled?: boolean;
  blocked?: string | null;
  replyingTo?: { name: string; snippet: string } | null;
  onCancelReply?: () => void;
  editing?: boolean;
  onCancelEdit?: () => void;
  above?: ReactNode;
  autoFocus?: boolean;
};

export function MessageComposer({ value, onChange, onSend, placeholder = 'Add to the conversation…', sending, disabled, blocked, replyingTo, onCancelReply, editing, onCancelEdit, above, autoFocus }: ComposerProps) {
  const can = !!value.trim() && !sending && !disabled && !blocked;
  return (
    <div className="composer" style={{ gap: replyingTo ? 8 : 4 }}>
      {above}
      {blocked && (
        <div className="row" style={{ gap: 4, padding: '0 0 2px 4px' }}>
          <Icon name="WarningCircle" size={16} tone="danger" />
          <span className="t-caption c-danger grow">{blocked}</span>
        </div>
      )}
      {replyingTo && (
        <div className="row" style={{ gap: 8, padding: '8px 4px 8px 12px', background: 'var(--action-subtle)', borderRadius: 8, boxShadow: 'inset 3px 0 0 var(--action-primary)' }}>
          <div className="col grow" style={{ gap: 2 }}>
            <div className="row" style={{ gap: 4 }}>
              <span className="t-label-s c-secondary">Replying to</span>
              <span className="t-label-s c-link">{replyingTo.name}</span>
            </div>
            <span className="t-body-s c-secondary trunc">{replyingTo.snippet}</span>
          </div>
          <button className="row center" style={{ width: 32, height: 32 }} onClick={onCancelReply} aria-label="Cancel reply">
            <Icon name="X" size={18} tone="secondary" />
          </button>
        </div>
      )}
      {editing && (
        <div className="row" style={{ gap: 8, padding: '0 4px 0 12px', height: 32 }}>
          <Icon name="PencilSimple" size={16} tone="accent" />
          <span className="t-label-s c-link grow">Editing message</span>
          <button className="row center" style={{ width: 32, height: 32 }} onClick={onCancelEdit} aria-label="Cancel edit">
            <Icon name="X" size={18} tone="secondary" />
          </button>
        </div>
      )}
      <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
        <label className={`cfield ${blocked ? 'blocked' : ''} ${disabled ? 'disabled' : ''}`}>
          <textarea
            rows={1}
            value={value}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
            onChange={(e) => {
              onChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (can) onSend?.(); } }}
            style={{ height: 22, color: disabled ? 'var(--text-disabled)' : undefined }}
          />
        </label>
        <button className={`send ${can || (value.trim() && !blocked && !disabled && !sending) ? 'on' : ''}`} onClick={() => can && onSend?.()} aria-label="Send">
          {sending ? (
            <Icon name="CircleNotch" size={22} tone="disabled" spin />
          ) : editing ? (
            <Icon name="Check" size={22} weight="bold" tone={can ? 'on-fill' : 'disabled'} />
          ) : (
            <Icon name="PaperPlaneTilt" size={22} tone={can ? 'on-fill' : 'disabled'} />
          )}
        </button>
      </div>
    </div>
  );
}

export type MentionOption = { name: string; username: string; initials: string };
export function MentionPicker({ options, onPick, style }: { options: MentionOption[]; onPick: (o: MentionOption) => void; style?: CSSProperties }) {
  return (
    <div className="popover" style={{ borderRadius: 12, ...style }}>
      {options.map((o) => (
        <button key={o.username} className="row fill" style={{ padding: '8px 12px', gap: 12, background: 'var(--surface-default)' }} onClick={() => onPick(o)}>
          <Avatar initials={o.initials} size="sm" />
          <span className="col grow">
            <span className="t-label c-primary">{o.name}</span>
            <span className="t-caption c-secondary">{o.username}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
