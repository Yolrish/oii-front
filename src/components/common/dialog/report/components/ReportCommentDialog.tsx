'use client'

import React from 'react';
import { ReportCommentType } from '../types/report-type';
import ReportDialog from './base/ReportDialog';

interface ReportCommentDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    commentId: string;
    userId: string;
}

export function ReportCommentDialog({
    open,
    onOpenChange,
    commentId,
    userId
}: ReportCommentDialogProps) {
    const reportData: Omit<ReportCommentType, 'description' | 'contact'> = {
        type: 'comment',
        params: {
            comment_id: commentId,
            user_id: userId
        }
    };

    return (
        <ReportDialog<ReportCommentType>
            open={open}
            onOpenChange={onOpenChange}
            title="Report Comment"
            reportData={reportData}
        />
    );
}

export default ReportCommentDialog; 