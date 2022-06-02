
export interface CardData {    
    header?: string;
    avatarImgPath?: string;
    subtitle?: string;
    title?: string;
    content?: string;
    contentHtml?: string;
    leftImgPath?: string;
    rightImgPath?: string;
    listChips?:  ListChip[];
}

interface ListChip {
    name?: string;
    chips?: Chip[];
}
interface Chip {
    title?: string;
    subtitle?: string;
}