-- Enable Realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable Realtime for order_items table (optional, for detailed updates)
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- Enable Realtime for agent_wallets table (for wallet balance updates)
ALTER PUBLICATION supabase_realtime ADD TABLE agent_wallets;

-- Enable Realtime for agent_transactions table (for transaction history)
ALTER PUBLICATION supabase_realtime ADD TABLE agent_transactions;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
