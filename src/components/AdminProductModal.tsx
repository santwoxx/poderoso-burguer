import React, { useRef, useState } from 'react';
import { X, Plus, Trash2, ImagePlus, Loader2, Link2 } from 'lucide-react';
import type { Category, Product, ProductAddon } from '../types';
import { uploadProductImage } from '../services/firebaseService';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product: Product | null;
  categories: Category[];
}

// Redimensiona e comprime a foto no navegador antes do upload, para não sobrecarregar
// o Storage com fotos de câmera de celular (que costumam vir com vários MB).
function compressImage(file: File, maxDimension = 1280, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas não suportado neste navegador'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao processar a imagem'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Falha ao carregar a imagem selecionada'));
    };
    img.src = objectUrl;
  });
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}) => {
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice ? String(product.originalPrice) : '');
  const [category, setCategory] = useState(product?.category || categories[0]?.id || '');
  const [image, setImage] = useState(product?.image || '');
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [requiresMeatPoint, setRequiresMeatPoint] = useState(product?.requiresMeatPoint || false);
  const [isCustomCombo, setIsCustomCombo] = useState(product?.isCustomCombo || false);
  const [addons, setAddons] = useState<ProductAddon[]>(product?.availableAddons || []);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddAddon = () => {
    setAddons((prev) => [...prev, { id: `addon-${Date.now()}`, name: '', price: 0 }]);
  };

  const handleAddonChange = (id: string, field: 'name' | 'price', value: string) => {
    setAddons((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: field === 'price' ? Number(value) || 0 : value } : a))
    );
  };

  const handleRemoveAddon = (id: string) => {
    setAddons((prev) => prev.filter((a) => a.id !== id));
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem (JPG, PNG, WEBP...).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Imagem muito grande (máximo 10MB).');
      return;
    }

    const previousImage = image;
    setImage(URL.createObjectURL(file)); // preview instantâneo
    setUploading(true);

    try {
      const compressed = await compressImage(file);
      const safeId = (product?.id || 'novo-produto').replace(/[^a-zA-Z0-9_-]/g, '');
      const fileName = `${safeId}-${Date.now()}.jpg`;
      const url = await uploadProductImage(compressed, fileName);
      setImage(url);
    } catch (err) {
      console.error('Error uploading product image:', err);
      alert('Não foi possível enviar a foto agora. Verifique sua internet e tente novamente, ou cole uma URL de imagem.');
      setImage(previousImage);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price || !category) {
      alert('Preencha ao menos nome, preço e categoria.');
      return;
    }
    if (uploading) {
      alert('Aguarde a foto terminar de enviar antes de salvar.');
      return;
    }
    if (image.startsWith('blob:')) {
      alert('A foto ainda não terminou de enviar. Aguarde um instante e tente salvar de novo.');
      return;
    }

    const newProduct: Product = {
      id: product?.id || `prod-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      image: image.trim() || '/logo.png',
      isAvailable,
      requiresMeatPoint,
      isCustomCombo,
      availableAddons: addons.filter((a) => a.name.trim()),
    };

    onSave(newProduct);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#141418] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-black text-white text-lg font-display">
          {product ? 'Editar Produto' : 'Novo Produto'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1.5">Foto do Produto</label>
            <div className="flex items-center gap-3">
              <div className="relative w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                {image ? (
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-black font-bold py-2 rounded-xl text-xs"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  {uploading ? 'Enviando...' : image ? 'Trocar Foto' : 'Enviar Foto'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-[11px] font-semibold"
                >
                  <Link2 className="w-3 h-3" />
                  ou usar uma URL de imagem
                </button>
              </div>
            </div>

            {showUrlInput && (
              <input
                type="text"
                value={image.startsWith('blob:') ? '' : image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full mt-2 bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-300 block mb-1">Preço Original (opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 block mb-1">Categoria *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white p-2.5 rounded-xl text-xs focus:border-orange-500 focus:outline-none"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-zinc-300 pt-1">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
              Disponível
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={requiresMeatPoint}
                onChange={(e) => setRequiresMeatPoint(e.target.checked)}
              />
              Pede ponto da carne
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={isCustomCombo} onChange={(e) => setIsCustomCombo(e.target.checked)} />
              É combo montável
            </label>
          </div>

          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-300">Adicionais Disponíveis</label>
              <button
                type="button"
                onClick={handleAddAddon}
                className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-[11px] font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {addons.map((addon) => (
              <div key={addon.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome do adicional"
                  value={addon.name}
                  onChange={(e) => handleAddonChange(addon.id, 'name', e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-white p-2 rounded-lg text-xs focus:border-orange-500 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Preço"
                  value={addon.price}
                  onChange={(e) => handleAddonChange(addon.id, 'price', e.target.value)}
                  className="w-20 bg-zinc-900 border border-zinc-800 text-white p-2 rounded-lg text-xs focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAddon(addon.id)}
                  className="text-zinc-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-black font-black py-3 rounded-xl shadow-lg shadow-orange-500/20 text-xs uppercase tracking-wider transition-all mt-2"
          >
            {uploading ? 'Enviando foto...' : 'Salvar Produto'}
          </button>
        </form>
      </div>
    </div>
  );
};
