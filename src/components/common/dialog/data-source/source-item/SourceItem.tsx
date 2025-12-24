'use client';

import Avatar from '@/components/common/avatar/Avatar';
import styles from './SourceItem.module.css';
import { useState, useEffect } from 'react';
import { memo } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
interface SourceItemProps {
    url: string;
    onDelete?: () => void;
}

function SourceItem({ url, onDelete }: SourceItemProps) {

    const [icon, setIcon] = useState<string>('');
    const [domain, setDomain] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    useEffect(() => {

        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace(/^www\./i, '');

        setDomain(domain);
    }, [url]);

    return (
        <div className={styles.timeline_source_list_item}>
            <div className={styles.timeline_source_list_item_info_container}>
                <div className={'flex flex-row flex-nowrap justify-start items-center gap-2'}>
                    <div className={styles.timeline_source_list_item_info_container_icon}>
                        <Avatar src={icon} alt={domain} hoverAnimation={false}
                            placeholderClassName={styles.timeline_source_list_item_info_container_icon}
                        />
                    </div>
                    <div className={styles.timeline_source_list_item_info_container_domain}>
                        <span>{domain}</span>
                    </div>
                </div>
                <button className={styles.timeline_source_list_item_info_container_delete}
                    onClick={() => {
                        onDelete?.();
                    }}
                >
                    <Trash2 />
                </button>
            </div>
            <div className={styles.timeline_source_list_item_info_container_description}>
                <span>{description?.length > 0 ? description : url}</span>
            </div>
        </div>
    )
}

export default memo(SourceItem);