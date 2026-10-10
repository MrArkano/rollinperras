import type { Catalog, Product } from '../domain/catalog'

const unsplash = (photo: string): string => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85`

/** Menú inicial: exactamente el contenido que antes estaba escrito en el componente. */
const products: readonly Product[] = [
  { id: 'mamacita', name: 'La Mamacita', category: 'Perras clásicas', description: 'Pan artesanal, carne del chef, tocineta, dip de queso crema, pico de gallo y crocante de patacón.', image: unsplash('photo-1612392062631-94dd858cba88'), sizes: [{ label: '17 cm', price: 24900 }, { label: '20 cm', price: 26900 }], tag: 'La clásica', active: true },
  { id: 'nea', name: 'Nea', category: 'Perras clásicas', description: 'Pan artesanal, papa fosforito, salchicha ranchera sesgada, mucha tocineta y queso gratinado.', image: unsplash('photo-1612392062798-2d5a6f7ef7f4'), sizes: [{ label: '17 cm', price: 19900 }, { label: '20 cm', price: 22900 }], active: true },
  { id: 'nea-estilo', name: 'Nea con Estilo', category: 'Perras clásicas', description: 'Pechuga a la parrilla bañada en salsa de la casa, tocineta, queso gratinado y toque del chef.', image: unsplash('photo-1612392061786-7d6e0b9f6c43'), sizes: [{ label: '17 cm', price: 22900 }, { label: '20 cm', price: 24900 }], active: true },
  { id: 'randoom', name: 'La Randoom', category: 'Perras clásicas', description: 'Carne de hamburguesa en salsa especial, pechuga a la parrilla, queso gratinado y mermelada de tocineta.', image: unsplash('photo-1550317138-10000687a72b'), sizes: [{ label: '17 cm', price: 24900 }, { label: '20 cm', price: 27900 }], active: true },
  { id: 'mor', name: 'Mor', category: 'Perras premium', description: 'Salchicha sesgada, pollo y carne desmechada en salsa de la casa, tocineta y queso gratinado.', image: unsplash('photo-1520072959219-c595dc870360'), sizes: [{ label: '17 cm', price: 24900 }, { label: '20 cm', price: 27900 }], tag: 'Premium', active: true },
  { id: 'chimbita', name: 'Chimbita', category: 'Perras premium', description: 'Pan brioche, panceta ahumada al barril, papa fosforito, piña asada y queso fundido.', image: unsplash('photo-1555939594-58d7cb561ad1'), sizes: [{ label: '17 cm', price: 24900 }, { label: '20 cm', price: 27900 }], tag: 'Favorita', active: true },
  { id: 'bichota', name: 'Bichota', category: 'Perras premium', description: 'Pollo y carne desmechada, madurito agridulce, tocineta, queso gratinado y panceta ahumada.', image: unsplash('photo-1565299507177-b0ac66763828'), sizes: [{ label: '17 cm', price: 29900 }, { label: '20 cm', price: 34900 }], active: true },
  { id: 'burger', name: 'Perraburger', category: 'Perra burger', description: 'Smash de 125 g, doble queso, pan brioche, lechuga romana, BIG-Rollin’, papa fosforito y tocineta con maple.', image: unsplash('photo-1568901346375-23c9450c58cd'), price: 26900, tag: 'Smash', active: true },
  { id: 'burger-mix', name: 'Perraburger Mix', category: 'Perra burger', description: 'Nuestra versión MIX con el mismo sabor brutal. Doble experiencia, pura actitud Rollin’.', image: unsplash('photo-1550547660-d9450f859349'), price: 29900, active: true },
  { id: 'bowl', name: 'Bowl Pancetazo Chill', category: 'Bowl', description: '140 g de panceta ahumada al barril, papa francesa o casco, pico de gallo, sour cream y queso salado.', image: unsplash('photo-1544025162-d76694265947'), price: 28900, tag: 'Arma tu bowl', active: true },
  { id: 'unica', name: 'La Única', category: 'Nuevos', description: 'Carne de res ahumada al barril con chimichurri, pollo a la parrilla o desmechado, parmesano y tocineta crocante.', image: unsplash('photo-1619740455993-9e612b1af08a'), sizes: [{ label: '20 cm', price: 34900 }], tag: 'Nueva', active: true },
  { id: 'bombastik', name: 'Bombastik', category: 'Nuevos', description: 'Costillas de cerdo ahumadas al barril en BBQ, tocineta, BIG-Rollin’, cebolla morada y papa en espiral.', image: unsplash('photo-1544025162-d76694265947'), sizes: [{ label: '17 cm', price: 28900 }, { label: '20 cm', price: 33900 }], active: true },
  { id: 'porchettno', name: 'Porchettno', category: 'Nuevos', description: 'Porchetta ahumada al barril, piña, blend de carne de 130 g, vegetales frescos y papa francesa.', image: unsplash('photo-1593504049359-74330189a345'), price: 34900, tag: 'Exclusiva', active: true },
  { id: 'fresh', name: 'Modo Fresh', category: 'Sodas', description: 'Hierbabuena, limón y jengibre.', image: unsplash('photo-1513558161293-cdaf765ed2fd'), price: 12000, active: true },
  { id: 'chimba', name: 'Full Chimba', category: 'Sodas', description: 'Maracuyá con romero.', image: unsplash('photo-1546173159-315724a31696'), price: 12000, active: true },
  { id: 'cora', name: 'Pa’ el Cora', category: 'Sodas', description: 'Frutos rojos.', image: unsplash('photo-1497534446932-c925b458314e'), price: 12000, active: true },
  { id: 'coca', name: 'Coca-Cola 400 ml', category: 'Bebidas', description: 'Para acompañar tu pedido.', image: unsplash('photo-1629203849820-fdd70d49c38e'), price: 4000, active: true },
  { id: 'water', name: 'Agua', category: 'Bebidas', description: 'Agua sin gas.', image: unsplash('photo-1548839140-29a749e1cf4d'), price: 3000, active: true },
]

export const SEED_CATALOG: Catalog = {
  categories: ['Perras clásicas', 'Perras premium', 'Perra burger', 'Nuevos', 'Bowl', 'Bebidas', 'Sodas'],
  products,
}
