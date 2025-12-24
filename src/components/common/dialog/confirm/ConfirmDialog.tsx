'use client'

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: string;
    content?: string;
    cancelText?: string;
    confirmText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmButtonClassName?: string;
    confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    waitTime?: number; // 等待时间（秒）
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title = "Confirm",
    content = "Are you sure you want to proceed?",
    cancelText = "Cancel",
    confirmText = "Confirm",
    onConfirm,
    onCancel,
    confirmButtonClassName,
    confirmButtonVariant = "outline",
    waitTime
}: ConfirmDialogProps) {
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isWaiting, setIsWaiting] = useState(false);

    useEffect(() => {
        if (open && waitTime && waitTime > 0) {
            setCountdown(waitTime);
            setIsWaiting(true);
            
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        setIsWaiting(false);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => {
                clearInterval(timer);
            };
        } else {
            setCountdown(null);
            setIsWaiting(false);
        }
    }, [open, waitTime]);

    const handleCancel = () => {
        onCancel?.();
        onOpenChange?.(false);
    };

    const handleConfirm = () => {
        if (!isWaiting) {
            onConfirm?.();
            onOpenChange?.(false);
        }
    };

    const handleClose = () => {
        onOpenChange?.(false);
    };

    const getConfirmButtonText = () => {
        if (isWaiting && countdown !== null) {
            return `(${countdown}s) ${confirmText}`;
        }
        return confirmText;
    };

    const getConfirmButtonClass = () => {
        if (isWaiting) {
            return cn(
                styles['confirm-dialog__confirm'],
                styles['confirm-dialog__confirm_waiting']
            );
        }
        
        if (confirmButtonVariant === 'destructive') {
            return cn(
                styles['confirm-dialog__confirm'],
                styles['confirm-dialog__confirm_danger'],
                confirmButtonClassName
            );
        }
        
        return cn(
            styles['confirm-dialog__confirm'],
            confirmButtonClassName
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                styles['confirm-dialog'],
                "confirm-dialog",
                "max-w-sm w-full mx-auto p-0"
            )}>

                <DialogHeader className={styles['confirm-dialog__header']}>
                    <DialogTitle className={styles['confirm-dialog__title']}>
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className={styles['confirm-dialog__content']}>
                    <p className={styles['confirm-dialog__text']}>
                        {content}
                    </p>
                </div>

                <div className={styles['confirm-dialog__actions']}>
                    <button
                        onClick={handleCancel}
                        className={styles['confirm-dialog__cancel']}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={getConfirmButtonClass()}
                        disabled={isWaiting}
                    >
                        {getConfirmButtonText()}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmDialog;
