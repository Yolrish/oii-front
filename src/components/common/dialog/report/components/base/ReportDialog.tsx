'use client'

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ReportType } from '../../types/report-type';
import { UserReportAPI } from '../../actions/user-report';
import styles from './ReportDialog.module.css';

interface ReportDialogProps<T extends ReportType> {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: string;
    reportData: Omit<T, 'description' | 'contact'>;
}

const MAX_DESCRIPTION_LENGTH = 500; // 最大字符限制

export function ReportDialog<T extends ReportType>({
    open,
    onOpenChange,
    title = "Report",
    reportData
}: ReportDialogProps<T>) {
    const [description, setDescription] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 监听对话框关闭事件，清空表单内容
    useEffect(() => {
        if (!open) {
            // 当对话框关闭时，清空表单内容
            setDescription('');
            setEmail('');
            setIsSubmitting(false);
        }
    }, [open]);

    const handleDialogClose = (isOpen: boolean) => {
        // 调用父组件的onOpenChange
        onOpenChange?.(isOpen);
        
        // 如果是关闭状态，清空表单（useEffect会处理）
        if (!isOpen) {
            console.log('Dialog closed, clearing form...');
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_DESCRIPTION_LENGTH) {
            setDescription(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error('Description is required');
            return;
        }

        setIsSubmitting(true);

        try {
            // 构造完整的举报数据
            const fullReportData = {
                ...reportData,
                description: description.trim(),
                contact: email.trim() || undefined
            } as T;

            console.log('Submitting report:', fullReportData);

            // 调用API
            const response = await UserReportAPI(fullReportData);

            if (response.code === 200) {
                toast.success('Report submitted successfully');
                // 提交成功后关闭对话框（表单会通过useEffect清空）
                onOpenChange?.(false);
            } else {
                toast.error(response.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            toast.error('Failed to submit report, please try again');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSubmitDisabled = !description.trim() || isSubmitting;
    const descriptionLength = description.length;
    const isDescriptionTooLong = descriptionLength > MAX_DESCRIPTION_LENGTH;

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent className={cn(
                styles['report-agent-dialog'],
                'report-agent-dialog',
                "max-w-md w-full mx-auto p-4"
            )}>
                <DialogHeader className={styles['report-agent-dialog__header']}>
                    <DialogTitle className={styles['report-agent-dialog__title']}>
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className={styles['report-agent-dialog__form']}>
                    {/* 描述文本区域 */}
                    <div className={styles['report-agent-dialog__field']}>
                        <textarea
                            className={cn(
                                styles['report-agent-dialog__textarea'],
                                isDescriptionTooLong && styles['report-agent-dialog__textarea--error']
                            )}
                            placeholder="Add Description"
                            value={description}
                            onChange={handleDescriptionChange}
                            rows={6}
                        />
                        <div className={styles['report-agent-dialog__character-count']}>
                            <span className={cn(
                                styles['report-agent-dialog__character-count-text'],
                                descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9 && styles['report-agent-dialog__character-count-text--warning'],
                                isDescriptionTooLong && styles['report-agent-dialog__character-count-text--error']
                            )}>
                                {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                            </span>
                        </div>
                    </div>

                    {/* 邮箱输入框 */}
                    <div className={styles['report-agent-dialog__field']}>
                        <Input
                            type="email"
                            className={styles['report-agent-dialog__input']}
                            placeholder="Contact Email(optional)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* 提交按钮 */}
                    <div className={styles['report-agent-dialog__actions']}>
                        <Button
                            type="submit"
                            disabled={isSubmitDisabled}
                            className={cn(
                                styles['report-agent-dialog__submit'],
                                isSubmitDisabled && styles['report-agent-dialog__submit--disabled']
                            )}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default ReportDialog;
