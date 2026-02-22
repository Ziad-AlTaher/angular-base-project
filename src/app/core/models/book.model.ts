export interface Book {
    id: number;
    categoryId: number;
    categoryNameAr: string;
    categoryNameEn: string;

    title: string;
    author: string;
    translator: string;
    publisher: string;

    sourceLang: string;
    targetLang: string;

    description: string;
    imageUrl: string;

    downloadLink: string;
    outSource: boolean;

    viewCount: number;
    downloadCount: number;
}
