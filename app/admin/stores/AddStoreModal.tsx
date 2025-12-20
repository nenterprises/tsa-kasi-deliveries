'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Upload, Plus, Trash2, MapPin } from 'lucide-react'
import { StoreCategory, Township } from '@/types'

interface AddStoreModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface ProductForm {
  name: string
  price: string
  category: string
  image?: File
}

export default function AddStoreModal({ onClose, onSuccess }: AddStoreModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Store form data
  const [storeData, setStoreData] = useState({
    name: '',
    category: '' as StoreCategory,
    phoneNumber: '',
    description: '',
    streetAddress: '',
    township: '',
    town: '' as Township,
    gpsLatitude: '',
    gpsLongitude: '',
    openTime: '',
    closeTime: '',
    operatingDays: 'Mon-Sun',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [productSetup, setProductSetup] = useState<'now' | 'later' | null>(null)
  const [products, setProducts] = useState<ProductForm[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setStoreData({
      ...storeData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0])
    }
  }

  const addProduct = () => {
    setProducts([...products, { name: '', price: '', category: '' }])
  }

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const updateProduct = (index: number, field: string, value: string | File) => {
    const updated = [...products]
    if (field === 'image' && value instanceof File) {
      updated[index].image = value
    } else if (typeof value === 'string') {
      updated[index] = { ...updated[index], [field]: value }
    }
    setProducts(updated)
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!storeData.name || !storeData.category || !storeData.phoneNumber || !storeData.streetAddress || !storeData.town) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // Upload logo if provided
      let logoUrl = ''
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('store-logos')
          .upload(fileName, logoFile)

        if (uploadError) {
          console.error('Logo upload error:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('store-logos')
            .getPublicUrl(fileName)
          logoUrl = publicUrl
        }
      }

      // Insert store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert([
          {
            name: storeData.name,
            category: storeData.category,
            phone_number: storeData.phoneNumber,
            description: storeData.description,
            street_address: storeData.streetAddress,
            township: storeData.township,
            town: storeData.town,
            gps_latitude: storeData.gpsLatitude ? parseFloat(storeData.gpsLatitude) : null,
            gps_longitude: storeData.gpsLongitude ? parseFloat(storeData.gpsLongitude) : null,
            open_time: storeData.openTime || null,
            close_time: storeData.closeTime || null,
            operating_days: storeData.operatingDays,
            logo_url: logoUrl,
            status: 'active',
            custom_orders_only: productSetup === 'later' || products.length === 0
          }
        ])
        .select()
        .single()

      if (storeError) throw storeError

      // Insert products if any
      if (productSetup === 'now' && products.length > 0 && store) {
        const productInserts = await Promise.all(
          products.map(async (product) => {
            let imageUrl = ''
            
            // Upload product image if provided
            if (product.image) {
              const fileExt = product.image.name.split('.').pop()
              const fileName = `${Date.now()}_${Math.random()}.${fileExt}`
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, product.image)

              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                  .from('product-images')
                  .getPublicUrl(fileName)
                imageUrl = publicUrl
              }
            }

            return {
              store_id: store.id,
              name: product.name,
              price: parseFloat(product.price),
              category: product.category,
              image_url: imageUrl,
              available: true
            }
          })
        )

        const { error: productsError } = await supabase
          .from('products')
          .insert(productInserts)

        if (productsError) {
          console.error('Products insert error:', productsError)
        }
      }

      onSuccess()
    } catch (err) {
      console.error('Error creating store:', err)
      setError('Failed to create store. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Store</h2>
            <p className="text-sm text-gray-400">Step {step} of 5</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-900/40 border border-red-700 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Store Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={storeData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Mama Joyce Spaza"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={storeData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  required
                >
                  <option value="">Select category...</option>
                  <option value="spaza">Spaza</option>
                  <option value="tuck_shop">Tuck Shop</option>
                  <option value="takeaways">Takeaways</option>
                  <option value="alcohol">Alcohol</option>
                  <option value="groceries">Groceries</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={storeData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="081 234 5678"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={storeData.description}
                  onChange={handleInputChange}
                  placeholder="Small spaza near Phagameng clinic..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Store Address</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Town <span className="text-red-500">*</span>
                </label>
                <select
                  name="town"
                  value={storeData.town}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  required
                >
                  <option value="">Select town...</option>
                  <option value="modimolle">Modimolle</option>
                  <option value="phagameng">Phagameng</option>
                  <option value="leseding">Leseding</option>
                  <option value="bela_bela">Bela-Bela</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Township/Area
                </label>
                <input
                  type="text"
                  name="township"
                  value={storeData.township}
                  onChange={handleInputChange}
                  placeholder="e.g., Phagameng"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={storeData.streetAddress}
                  onChange={handleInputChange}
                  placeholder="1037 Leseding Street"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GPS Latitude
                  </label>
                  <input
                    type="text"
                    name="gpsLatitude"
                    value={storeData.gpsLatitude}
                    onChange={handleInputChange}
                    placeholder="-24.123456"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GPS Longitude
                  </label>
                  <input
                    type="text"
                    name="gpsLongitude"
                    value={storeData.gpsLongitude}
                    onChange={handleInputChange}
                    placeholder="28.123456"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex items-start">
                  <MapPin className="text-kasi-blue mr-2 mt-1" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-white">GPS Location (Optional)</p>
                    <p className="text-xs text-gray-300 mt-1">
                      You can add GPS coordinates for more accurate delivery routing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Operating Hours */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Operating Hours</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Open Time
                  </label>
                  <input
                    type="time"
                    name="openTime"
                    value={storeData.openTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Close Time
                  </label>
                  <input
                    type="time"
                    name="closeTime"
                    value={storeData.closeTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-kasi-blue focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Days
                </label>
                <input
                  type="text"
                  name="operatingDays"
                  value={storeData.operatingDays}
                  onChange={handleInputChange}
                  placeholder="Mon-Sun"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          )}

          {/* Step 4: Store Photo */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Store Photo / Logo</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {logoFile ? (
                  <div>
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt="Logo preview"
                      className="mx-auto max-h-48 rounded-lg mb-4"
                    />
                    <button
                      onClick={() => setLogoFile(null)}
                      className="text-red-600 hover:text-red-700 font-semibold"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">Upload store logo or photo</p>
                    <label className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Leave empty to use default store icon
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Products Setup */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Products Setup</h3>
              
              {productSetup === null ? (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">How would you like to manage products for this store?</p>
                  
                  <button
                    onClick={() => setProductSetup('now')}
                    className="w-full p-6 border-2 border-primary-500 rounded-lg hover:bg-primary-50 transition text-left"
                  >
                    <div className="font-semibold text-gray-800 mb-2">Add products manually now</div>
                    <div className="text-sm text-gray-600">
                      Create a product menu that customers can browse
                    </div>
                  </button>

                  <button
                    onClick={() => setProductSetup('later')}
                    className="w-full p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition text-left"
                  >
                    <div className="font-semibold text-gray-800 mb-2">Skip – Add products later</div>
                    <div className="text-sm text-gray-600">
                      Enable "Custom Orders Only" mode. Customers can request any item and drivers will purchase manually.
                    </div>
                  </button>
                </div>
              ) : productSetup === 'later' ? (
                <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">🛒 Custom Orders Only Mode</h4>
                  <p className="text-sm text-orange-700 mb-4">
                    This store will appear with "Custom Orders Only" tag. Customers can request any item they want, and drivers will purchase it manually.
                  </p>
                  <button
                    onClick={() => setProductSetup(null)}
                    className="text-orange-600 hover:text-orange-700 font-semibold text-sm"
                  >
                    ← Change selection
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-gray-600">Add products to this store</p>
                    <button
                      onClick={() => setProductSetup(null)}
                      className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                    >
                      ← Change mode
                    </button>
                  </div>

                  {products.map((product, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-gray-800">Product #{index + 1}</h4>
                        <button
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Product Name (e.g., Russian & Chips)"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            placeholder="Price (R)"
                            value={product.price}
                            onChange={(e) => updateProduct(index, 'price', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          />
                          <input
                            type="text"
                            placeholder="Category (e.g., Fast Food)"
                            value={product.category}
                            onChange={(e) => updateProduct(index, 'category', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Product Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                updateProduct(index, 'image', e.target.files[0])
                              }
                            }}
                            className="w-full text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addProduct}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition flex items-center justify-center"
                  >
                    <Plus size={20} className="mr-2" />
                    Add Another Product
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-6 py-2 text-gray-300 hover:text-white font-semibold"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving Store...' : 'Save Store'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
