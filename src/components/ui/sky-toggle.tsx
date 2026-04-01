import { cn } from "@/lib/utils";
import styles from "./sky-toggle.module.css";

type SkyToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
  disabled?: boolean;
  size?: number;
  touchTarget?: boolean;
};

export function SkyToggle({
  checked,
  onCheckedChange,
  label,
  className,
  disabled = false,
  size,
  touchTarget = false,
}: SkyToggleProps) {
  return (
    <div className={cn(styles.root, className)}>
      <label
        className={cn(styles.switch, touchTarget && styles.touchTarget)}
        style={size ? ({ '--toggle-size': `${size}px` } as React.CSSProperties) : undefined}
      >
        <span className={styles.srOnly}>{label}</span>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={checked}
          onChange={(event) => {
            onCheckedChange(event.target.checked);
          }}
          disabled={disabled}
          aria-label={label}
        />

        <span className={styles.track}>
          <span className={styles.clouds} aria-hidden="true" />

          <span className={styles.stars} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="6" r="1.4" fill="currentColor" />
              <circle cx="14" cy="4" r="1.1" fill="currentColor" />
              <circle cx="19" cy="9" r="1.2" fill="currentColor" />
              <circle cx="9" cy="11" r="0.9" fill="currentColor" />
            </svg>
          </span>

          <span className={styles.thumbWrap}>
            <span className={styles.thumb}>
              <span className={styles.moon}>
                <span className={styles.spot} />
                <span className={styles.spot} />
                <span className={styles.spot} />
              </span>
            </span>
          </span>
        </span>
      </label>
    </div>
  );
}
