import * as React from "react"
import { cn } from "../../lib/utils"

// A simplified version of the Sheet component that doesn't rely on Radix UI
const SheetContext = React.createContext({
  open: false,
  onOpenChange: () => {},
})

const Sheet = ({ 
  children, 
  open, 
  onOpenChange 
}) => {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const { onOpenChange } = React.useContext(SheetContext)
  const Comp = asChild ? React.Children.only(children).type : "button"
  
  return (
    <Comp
      ref={ref}
      className={className}
      onClick={() => onOpenChange(true)}
      {...props}
    >
      {asChild ? React.Children.only(children).props.children : children}
    </Comp>
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetContent = React.forwardRef(({ className, children, side = "right", ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SheetContext)
  
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }
    
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onOpenChange])
  
  if (!open) return null
  
  return (
    <React.Fragment>
      <div 
        className="fixed inset-0 z-50 bg-black/80" 
        onClick={() => onOpenChange(false)}
        {...props}
      />
      <div
        ref={ref}
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out h-full",
          side === "right" && "inset-y-0 right-0 border-l",
          side === "left" && "inset-y-0 left-0 border-r",
          side === "top" && "inset-x-0 top-0 border-b",
          side === "bottom" && "inset-x-0 bottom-0 border-t",
          className
        )}
      >
        {children}
      </div>
    </React.Fragment>
  )
})
SheetContent.displayName = "SheetContent"

export { Sheet, SheetTrigger, SheetContent }