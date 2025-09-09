import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { getNewsList, NewsItem } from '@/services/newsApi';
import { useNavigate } from 'react-router-dom';

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    const newsList = await getNewsList();
    setNews(newsList);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Latest News</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/news/${item.id}`)}>
            <CardHeader className="p-0">
              <img src={item.thumbnail} alt={item.title} className="w-full h-40 object-cover rounded-t-lg" />
            </CardHeader>
            <CardContent className="p-4">
              {/* Removed date badge */}
              <CardTitle className="text-lg font-bold mb-1 truncate">{item.title}</CardTitle>
              <div className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.shortDesc}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default News;
