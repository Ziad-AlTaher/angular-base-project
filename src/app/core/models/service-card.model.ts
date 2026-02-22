import { Book } from './book.model';

export interface ServiceCard {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    author: string;
    publisher: string;
    translator: string;
    downloadLink: string;
    outSource: boolean;
    viewCount: number;
    downloadCount: number;
}

/**
 * Maps a Book (API model) to a ServiceCard (view model).
 * Selects category name based on current language.
 */
export function mapBookToCard(book: Book, lang: 'ar' | 'en'): ServiceCard {
    return {
        id: book.id,
        title: book.title,
        description: book.description,
        imageUrl: book.imageUrl || 'assets/images/placeholder-book.svg',
        category: lang === 'ar' ? book.categoryNameAr : book.categoryNameEn,
        author: book.author,
        publisher: book.publisher,
        translator: book.translator,
        downloadLink: book.downloadLink,
        outSource: book.outSource,
        viewCount: book.viewCount,
        downloadCount: book.downloadCount
    };
}
