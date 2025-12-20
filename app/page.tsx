import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-kasi-black">
      <div className="text-center max-w-4xl">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-4 tracking-tight">
            <span className="text-kasi-blue">TSA</span>{' '}
            <span className="text-kasi-orange">KASi</span>
          </h1>
          <p className="text-kasi-orange text-xl md:text-2xl font-medium tracking-wider">
            Deliveries
          </p>
        </div>
        
        <p className="text-white text-2xl md:text-3xl mb-4 font-light">
          Fast. Local. Kasi to Kasi.
        </p>
        
        <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
          Your township delivery service for fast-food, groceries, alcohol, and parcels. 
          Connecting communities in Modimolle and Bela-Bela.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link 
            href="/customer/stores" 
            className="bg-kasi-orange text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition transform hover:scale-105 shadow-lg shadow-orange-500/50"
          >
            🛒 Order Now
          </Link>
          <Link 
            href="/agent/login" 
            className="bg-kasi-blue text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-opacity-90 transition transform hover:scale-105 shadow-lg shadow-blue-500/50"
          >
            🏍️ Drive for Us
          </Link>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-kasi-blue rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-kasi-orange rounded-full opacity-20 blur-3xl"></div>
    </main>
  )
}
