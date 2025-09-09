-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  wallet_balance DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
  total_portfolio_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stocks table
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_code TEXT NOT NULL UNIQUE,
  stock_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  change_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  change_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  price_history JSONB DEFAULT '[]'::jsonb,
  sector TEXT,
  market_cap BIGINT,
  volume BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolio table
CREATE TABLE public.portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  avg_price DECIMAL(10,2) NOT NULL CHECK (avg_price > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, stock_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'WARNING', 'SUCCESS', 'ERROR')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for stocks (public read, admin write)
CREATE POLICY "Anyone can view stocks" ON public.stocks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage stocks" ON public.stocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for portfolio
CREATE POLICY "Users can view their own portfolio" ON public.portfolio
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own portfolio" ON public.portfolio
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all portfolios" ON public.portfolio
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for notifications (public read, admin write)
CREATE POLICY "Anyone can view notifications" ON public.notifications
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, wallet_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    10000.00
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON public.stocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON public.portfolio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample stocks
INSERT INTO public.stocks (stock_code, stock_name, price, change_percent, change_amount, sector, market_cap, volume) VALUES
('AAPL', 'Apple Inc.', 150.25, 2.45, 3.59, 'Technology', 2400000000000, 45000000),
('GOOGL', 'Alphabet Inc.', 2750.80, -1.2, -33.40, 'Technology', 1800000000000, 28000000),
('MSFT', 'Microsoft Corporation', 305.15, 1.8, 5.39, 'Technology', 2300000000000, 35000000),
('AMZN', 'Amazon.com Inc.', 3200.45, 0.95, 30.15, 'E-commerce', 1600000000000, 25000000),
('TSLA', 'Tesla Inc.', 850.60, -3.2, -28.20, 'Automotive', 850000000000, 55000000),
('NVDA', 'NVIDIA Corporation', 450.30, 4.5, 19.45, 'Technology', 1100000000000, 42000000),
('META', 'Meta Platforms Inc.', 320.75, -0.8, -2.58, 'Technology', 850000000000, 30000000),
('NFLX', 'Netflix Inc.', 420.90, 2.1, 8.65, 'Entertainment', 180000000000, 18000000);

-- Insert sample notifications
INSERT INTO public.notifications (title, message, type) VALUES
('Welcome to Virtual Trade Pro!', 'Start your trading journey with $10,000 virtual money.', 'SUCCESS'),
('Market Update', 'Tech stocks showing strong performance today.', 'INFO'),
('New Feature', 'Real-time price updates now available!', 'INFO');