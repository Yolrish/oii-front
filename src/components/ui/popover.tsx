"use client"

import * as React from "react"

import {
  Popover as PopoverPrimitive,
  PopoverTrigger as PopoverTriggerPrimitive,
  PopoverContent as PopoverContentPrimitive,
  PopoverPortal as PopoverPortalPrimitive,
  PopoverClose as PopoverClosePrimitive,
  type PopoverProps as PopoverPrimitiveProps,
  type PopoverTriggerProps as PopoverTriggerPrimitiveProps,
  type PopoverContentProps as PopoverContentPrimitiveProps,
  type PopoverCloseProps as PopoverClosePrimitiveProps,
} from "@radix-ui/react-popover"

import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  type Transition,
} from 'motion/react'

import { cn } from '@/lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';

const getInitialPosition = (side: Side) => {
  switch (side) {
    case 'top':
      return { y: 15 };
    case 'bottom':
      return { y: -15 };
    case 'left':
      return { x: 15 };
    case 'right':
      return { x: -15 };
  }
};

// Context to expose open state for animated content
type PopoverContextType = { isOpen: boolean };
const PopoverContext = React.createContext<PopoverContextType | undefined>(undefined);

const usePopover = (): PopoverContextType => {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error('usePopover must be used within a Popover');
  return ctx;
};

type PopoverProps = PopoverPrimitiveProps;

function Popover(props: PopoverProps) {
  const [isOpen, setIsOpen] = React.useState(props?.open ?? props?.defaultOpen ?? false);

  React.useEffect(() => {
    if (props?.open !== undefined) setIsOpen(props.open);
  }, [props?.open]);

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    props.onOpenChange?.(open);
  }, [props]);

  return (
    <PopoverContext.Provider value={{ isOpen }}>
      <PopoverPrimitive {...props} onOpenChange={handleOpenChange} />
    </PopoverContext.Provider>
  );
}

type PopoverTriggerProps = PopoverTriggerPrimitiveProps;

function PopoverTrigger(props: PopoverTriggerProps) {
  return <PopoverTriggerPrimitive {...props} />;
}

type PopoverContentProps = PopoverContentPrimitiveProps & HTMLMotionProps<'div'> & { transition?: Transition };

function PopoverContent({
  className,
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  transition = { type: 'spring', stiffness: 300, damping: 25 },
  children,
  ...props
}: PopoverContentProps) {
  const { isOpen } = usePopover();
  const initialPosition = getInitialPosition(side as Side);

  return (
    <PopoverPortalPrimitive>
      <AnimatePresence>
        {isOpen && (
          <PopoverContentPrimitive
            forceMount
            align={align}
            side={side}
            sideOffset={sideOffset}
            className="z-50"
            {...props}
          >
            <motion.div
              key="popover-content"
              initial={{ opacity: 0, scale: 0.5, ...initialPosition }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, ...initialPosition }}
              transition={transition}
              className={cn(
                'bg-popover text-popover-foreground w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
                className,
              )}
            >
              {children}
            </motion.div>
          </PopoverContentPrimitive>
        )}
      </AnimatePresence>
    </PopoverPortalPrimitive>
  );
}

type PopoverCloseProps = PopoverClosePrimitiveProps;

function PopoverClose(props: PopoverCloseProps) {
  return <PopoverClosePrimitive {...props} />;
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  usePopover,
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverContentProps,
  type PopoverCloseProps,
};