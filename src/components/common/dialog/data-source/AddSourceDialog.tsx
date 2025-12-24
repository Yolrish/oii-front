'use client'

import React, { use, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import styles from './AddSourceDialog.module.css';
import SourceItem from './source-item/SourceItem';
import { toast } from 'sonner';

// URL验证函数
const isValidUrl = (urlString: string): boolean => {
    try {
        const url = new URL(urlString);
        // 检查协议是否为http或https
        if (!['http:', 'https:'].includes(url.protocol)) {
            toast.error('URL must start with http:// or https://');
            return false;
        }
        // 检查域名是否有效
        if (!url.hostname) {
            toast.error('Invalid domain');
            return false;
        }
        return true;
    } catch (error) {
        toast.error('Please enter a valid URL');
        return false;
    }
};

interface AddSourceDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    source?: string[];
    setSource?: Function;
    title?: string;
    content?: string;
    cancelText?: string;
    confirmText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmButtonClassName?: string;
}

export function AddSourceDialog({
    open,
    onOpenChange,
    source,
    setSource,
    title = "Add Your Data Source",
    cancelText = "Cancel",
    confirmText = "Confirm",
    onConfirm,
    onCancel,
    confirmButtonClassName,
}: AddSourceDialogProps) {

    const [currentSource, setCurrentSource] = useState<string[]>(source ?? []);
    const [currentSourceInput, setCurrentSourceInput] = useState<string>('');

    useEffect(() => {
        setCurrentSource(source ?? []);
    }, [source, open]);

    const handleCancel = () => {
        onCancel?.();
        onOpenChange?.(false);
    };

    const handleConfirm = () => {
        setSource?.(currentSource);
        onConfirm?.();
        onOpenChange?.(false);
    };

    // 表单输入
    const handleSourceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentSourceInput(e.target.value);
    }

    // 表单提交
    const handleSourceInputSubmit = () => {
        try {
            //去重
            if (currentSource.includes(currentSourceInput)) {
                return;
            }
            // 验证是否为有效的URL
            if (!isValidUrl(currentSourceInput)) {
                return;
            }
            setCurrentSource((prev: string[]) => [...prev, currentSourceInput]);
            setCurrentSourceInput('');
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                styles.addSource_dialog,
                "add_source_dialog",
                "max-w-sm w-full mx-auto p-0"
            )}>

                <DialogHeader className={styles.addSource_dialog_header}>
                    <DialogTitle className={styles.addSource_dialog_title}>
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className={styles.addSource_dialog_content}>
                    {/* Past URL */}
                    <div className={styles.addSource_dialog_pastUrl_container}>
                        <div className={styles.addSource_dialog_pastUrl_title}>
                            <span>
                                Past URL
                            </span>
                        </div>
                        {/* 输入 */}
                        <div className={styles.addSource_dialog_pastUrl_input_container}>
                            <input className={styles.addSource_dialog_pastUrl_input}
                                type="url" placeholder="https://www.reddit.com/"
                                value={currentSourceInput}
                                onChange={handleSourceInputChange}
                            />
                            <button className={styles.addSource_dialog_pastUrl_input_button}
                                onClick={handleSourceInputSubmit}
                            >
                                <span>
                                    Submit
                                </span>
                            </button>
                        </div>
                    </div>
                    {/* Added URLs */}
                    <div className={styles.addSource_dialog_addedUrls_container}>
                        <div className={styles.addSource_dialog_addedUrls_title}>
                            <span>
                                Added URLs
                            </span>
                        </div>
                        <div className={styles.addSource_dialog_addedUrls_list}>
                            {currentSource?.map((url, index) => (
                                <SourceItem url={url} key={index}
                                    onDelete={() => {
                                        setCurrentSource((prev: string[]) => prev.filter((_, i) => i !== index));
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.addSource_dialog_actions}>
                    <button
                        onClick={handleCancel}
                        className={styles.addSource_dialog_cancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={cn(
                            styles.addSource_dialog_confirm,
                            confirmButtonClassName
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </DialogContent>
        </Dialog >
    );
}

export default AddSourceDialog;
