import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNewsById, NewsItem } from '@/services/newsApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadNewsDetail(id);
    }
  }, [id]);

  const loadNewsDetail = async (newsId: string) => {
    setLoading(true);
    const newsItem = await getNewsById(newsId);
    setNews(newsItem);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  if (!news) {
    return <div className="text-center text-muted-foreground mt-10">News not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-4 text-primary font-semibold hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to News
      </button>
      <Card className="overflow-hidden shadow-lg">
        <img src={news.thumbnail} alt={news.title} className="w-full h-56 object-cover" />
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-2">{news.title}</h1>
          <div className="text-base text-muted-foreground mb-4">{news.shortDesc}</div>
          <div className="prose max-w-none text-gray-900" style={{ whiteSpace: 'pre-line' }}>{news.LongDesc}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsDetail;
