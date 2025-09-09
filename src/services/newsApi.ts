import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

export interface NewsItem {
  id: string;
  thumbnail: string;
  title: string;
  shortDesc: string;
  LongDesc: string;
  createdAt?: number;
}

export const getNewsList = async (): Promise<NewsItem[]> => {
  try {
    const newsRef = collection(db, 'news');
    const querySnapshot = await getDocs(newsRef);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: data.id || docSnap.id,
        thumbnail: data.thumbnail,
        title: data.title,
        shortDesc: data.shortDesc,
        LongDesc: data.LongDesc,
        createdAt: data.createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
};

export const getNewsById = async (newsId: string): Promise<NewsItem | null> => {
  try {
    const newsDoc = await getDoc(doc(db, 'news', newsId));
    if (!newsDoc.exists()) return null;
    const data = newsDoc.data();
    return {
      id: data.id || newsDoc.id,
      thumbnail: data.thumbnail,
      title: data.title,
      shortDesc: data.shortDesc,
      LongDesc: data.LongDesc,
      createdAt: data.createdAt,
    };
  } catch (error) {
    console.error('Error fetching news by id:', error);
    return null;
  }
};
