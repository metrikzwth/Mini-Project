import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    name: string;
    image?: string;
    className?: string;
    fallbackClassName?: string;
}

export function UserAvatar({ name, image, className, fallbackClassName }: UserAvatarProps) {
    let imgSrc = image;

    if (imgSrc && imgSrc !== '/placeholder.svg' && !imgSrc.startsWith('http')) {
        if (!imgSrc.startsWith('data:image')) {
            imgSrc = `data:image/jpeg;base64,${imgSrc}`;
        }
    }

    const getInitials = (name: string) => {
        if (!name) return 'NA';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const hasValidImage = imgSrc && imgSrc !== '/placeholder.svg' && imgSrc.trim().length > 0;

    return (
        <Avatar className={cn("border object-cover", className)}>
            {hasValidImage ? (
                <AvatarImage src={imgSrc} alt={name} className="object-cover" />
            ) : (
                <AvatarFallback className={cn("bg-primary/10 text-primary font-medium", fallbackClassName)}>
                    {getInitials(name)}
                </AvatarFallback>
            )}
        </Avatar>
    );
}
