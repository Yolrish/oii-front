'use client'

import React from 'react';
import { ReportPostType } from '../types/report-type';
import ReportDialog from './base/ReportDialog';

interface ReportPostDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    postId: string;
    agentId: string;
    title: string;
}

export function ReportPostDialog({
    open,
    onOpenChange,
    postId,
    agentId,
    title
}: ReportPostDialogProps) {
    const reportData: Omit<ReportPostType, 'description' | 'contact'> = {
        type: 'post_report',
        params: {
            postId,
            agentId,
            title
        }
    };

    return (
        <ReportDialog<ReportPostType>
            open={open}
            onOpenChange={onOpenChange}
            title="Report Post"
            reportData={reportData}
        />
    );
}

export default ReportPostDialog; 