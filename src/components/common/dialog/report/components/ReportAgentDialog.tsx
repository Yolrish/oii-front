'use client'

import React from 'react';
import { ReportAgentType } from '../types/report-type';
import ReportDialog from './base/ReportDialog';

interface ReportAgentDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    agentId: string;
    agentName: string;
}

export function ReportAgentDialog({
    open,
    onOpenChange,
    agentId,
    agentName
}: ReportAgentDialogProps) {
    const reportData: Omit<ReportAgentType, 'description' | 'contact'> = {
        type: 'agent_report',
        params: {
            agentId,
            name: agentName
        }
    };

    return (
        <ReportDialog<ReportAgentType>
            open={open}
            onOpenChange={onOpenChange}
            title="Report The Bot"
            reportData={reportData}
        />
    );
}

export default ReportAgentDialog; 