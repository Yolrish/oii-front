export interface ReportAgentType {
    type: 'agent_report',
    params: {
        agentId: string,
        name: string
    }
    description: string,
    contact?: string
}

export interface ReportCommentType {
    type: 'comment',
    params: {
        comment_id: string,
        user_id: string,
    }
    description: string,
    contact?: string
}


export interface ReportPostType {
    type: 'post_report',
    params: {
        postId: string,
        agentId: string,
        title: string,
    }
    description: string,
    contact?: string
}

export type ReportType = ReportAgentType | ReportCommentType | ReportPostType;
