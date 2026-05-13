
"use client";

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, runTransaction, writeBatch } from 'firebase/firestore';
import type { MenuItem, CartItem, FirestoreCartItem, AddonOption, SizeOption } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (item: MenuItem, selectedAddons?: AddonOption[], selectedSize?: SizeOption, observation?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  cartTotal: number;
  itemCount: number;
}

const serializeAddons = (addons: AddonOption[] = []) =>
  JSON.stringify(
    [...addons]
      .map((addon) => ({
        name: addon.name.trim().toLowerCase(),
        quantity: Number(addon.quantity),
        unit: addon.unit.trim().toLowerCase(),
        price: Number(addon.price),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

const serializeSize = (size?: SizeOption) =>
  size
    ? JSON.stringify({
        name: size.name.trim().toLowerCase(),
        price: Number(size.price),
      })
    : '';

const serializeObservation = (observation?: string) => observation?.trim().toLowerCase() ?? '';

const getAddonTotal = (addons: AddonOption[] = []) =>
  addons.reduce((total, addon) => total + Number(addon.price || 0), 0);

const getItemBasePrice = (item: CartItem) => Number(item.selectedSize?.price ?? item.menuItem.price ?? 0);

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const cartCollectionPath = user ? `users/${user.uid}/cart` : '';
  const { data: firestoreCartItems, loading: cartLoading } = useCollection<FirestoreCartItem>(cartCollectionPath);

  const cartItems: CartItem[] = useMemo(() => {
    if (!firestoreCartItems) return [];
    // The schema in Firestore is different from what the UI expects.
    // We transform it here.
    return firestoreCartItems.map(item => ({
      id: item.id, // This is the document ID in the cart subcollection
      menuItem: {
        id: item.menuItemId,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        // Add other MenuItem properties if they exist on the cart item,
        // otherwise provide defaults.
        description: item.description || '',
        category: item.category || '',
        imageHint: item.imageHint || '',
      },
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      selectedAddons: item.selectedAddons || [],
      observation: item.observation || '',
    }));
  }, [firestoreCartItems]);
  
  const addToCart = async (item: MenuItem, selectedAddons: AddonOption[] = [], selectedSize?: SizeOption, observation = '') => {
    if (!user || !firestore) {
        toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" });
        return;
    }

    try {
      const cartCollectionRef = collection(firestore, `users/${user.uid}/cart`);
      const selectedAddonsKey = serializeAddons(selectedAddons);
      const selectedSizeKey = serializeSize(selectedSize);
      const observationKey = serializeObservation(observation);
      
      // Transaction to check if item already exists
      await runTransaction(firestore, async (transaction) => {
        const existingCartItem = firestoreCartItems?.find(ci =>
          ci.menuItemId === item.id && serializeAddons(ci.selectedAddons || []) === selectedAddonsKey && serializeSize(ci.selectedSize) === selectedSizeKey && serializeObservation(ci.observation) === observationKey
        );

        if (existingCartItem) {
          const itemDocRef = doc(firestore, `users/${user.uid}/cart`, existingCartItem.id);
          transaction.update(itemDocRef, { quantity: existingCartItem.quantity + 1 });
        } else {
           const newItem: Omit<FirestoreCartItem, 'id'> = {
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            imageUrl: item.imageUrl,
            description: item.description || '',
            category: item.category || '',
            imageHint: item.imageHint || '',
            selectedSize: selectedSize || null as any,
            selectedAddons: selectedAddons || [],
            observation: observation.trim(),
           };
           // In a transaction, we use the transaction's `set` or `add` method, but addDoc is not available.
           // So we create a new doc ref and set it.
           const newDocRef = doc(cartCollectionRef);
           transaction.set(newDocRef, newItem);
        }
      });

      toast({
        title: "Adicionado ao carrinho",
        description: `${item.name} está agora no seu pedido.`,
      });

    } catch (error) {
       console.error("Error adding to cart:", error);
       toast({ title: "Erro", description: "Não foi possível adicionar ao carrinho.", variant: "destructive" });
    }
  };
  
  const removeFromCart = async (cartItemId: string) => {
    if (!user) return;
    const itemDocRef = doc(firestore, `users/${user.uid}/cart`, cartItemId);
    await deleteDoc(itemDocRef);
  };
  
  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
    } else {
      const itemDocRef = doc(firestore, `users/${user.uid}/cart`, cartItemId);
      await updateDoc(itemDocRef, { quantity });
    }
  };
  
  const clearCart = async () => {
    if (!user || !firestoreCartItems || firestoreCartItems.length === 0) return;
    
    const batch = writeBatch(firestore);
    const cartCollectionRef = collection(firestore, `users/${user.uid}/cart`);

    firestoreCartItems.forEach(item => {
        const docRef = doc(cartCollectionRef, item.id);
        batch.delete(docRef);
    });

    await batch.commit();
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + (getItemBasePrice(item) + getAddonTotal(item.selectedAddons || [])) * item.quantity,
    0
  );

  const itemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading: userLoading || cartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
