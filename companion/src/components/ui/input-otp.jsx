import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * @typedef {Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "children"> & {
 *   value?: string,
 *   onChange?: (newValue: string) => unknown,
 *   maxLength: number,
 *   textAlign?: "left" | "center" | "right",
 *   onComplete?: (...args: any[]) => unknown,
 *   pushPasswordManagerStrategy?: "increase-width" | "none",
 *   pasteTransformer?: (pasted: string) => string,
 *   containerClassName?: string,
 *   noScriptCSSFallback?: string | null,
 *   children: React.ReactNode
 * }} InputOTPProps
 * @typedef {React.HTMLAttributes<HTMLDivElement>} InputOTPGroupProps
 * @typedef {React.HTMLAttributes<HTMLDivElement> & { index: number }} InputOTPSlotProps
 * @typedef {React.HTMLAttributes<HTMLDivElement>} InputOTPSeparatorProps
 */

/** @type {React.ForwardRefExoticComponent<InputOTPProps & React.RefAttributes<HTMLInputElement>>} */
const InputOTP = React.forwardRef(
  /**
   * @param {InputOTPProps} props
   * @param {React.ForwardedRef<HTMLInputElement>} ref
   */
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props} />
  )
)
InputOTP.displayName = "InputOTP"

/** @type {React.ForwardRefExoticComponent<InputOTPGroupProps & React.RefAttributes<HTMLDivElement>>} */
const InputOTPGroup = React.forwardRef(
  /**
   * @param {InputOTPGroupProps} props
   * @param {React.ForwardedRef<HTMLDivElement>} ref
   */
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center", className)} {...props} />
  )
)
InputOTPGroup.displayName = "InputOTPGroup"

/** @type {React.ForwardRefExoticComponent<InputOTPSlotProps & React.RefAttributes<HTMLDivElement>>} */
const InputOTPSlot = React.forwardRef(
  /**
   * @param {InputOTPSlotProps} props
   * @param {React.ForwardedRef<HTMLDivElement>} ref
   */
  ({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext)
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

    return (
      (<div
        ref={ref}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
          isActive && "z-10 ring-1 ring-ring",
          className
        )}
        {...props}>
        {char}
        {hasFakeCaret && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
          </div>
        )}
      </div>)
    );
  }
)
InputOTPSlot.displayName = "InputOTPSlot"

/** @type {React.ForwardRefExoticComponent<InputOTPSeparatorProps & React.RefAttributes<HTMLDivElement>>} */
const InputOTPSeparator = React.forwardRef(
  /**
   * @param {InputOTPSeparatorProps} props
   * @param {React.ForwardedRef<HTMLDivElement>} ref
   */
  ({ ...props }, ref) => (
    <div ref={ref} role="separator" {...props}>
      <Minus />
    </div>
  )
)
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }