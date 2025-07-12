
import React from 'react';
import { Message } from '../types';

interface MessagesPanelProps {
    messages: Message[];
    onRead: (id: string) => void;
    onDelete: (id: string) => void;
    onDeleteAll: () => void;
}

const MessagesPanel: React.FC<MessagesPanelProps> = (props) => {
    return <div>Messages Panel Placeholder</div>;
};

export default MessagesPanel;
