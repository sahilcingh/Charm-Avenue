'use client';
import { useWishlist } from './wishlist-context';
import { useToast } from './toast-context';

/** Wishlist toggle + the standard toast feedback for each outcome, shared by every "heart" button. */
export function useWishlistToggle() {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { showToast } = useToast();

    const toggleWithFeedback = async (productId: string, productName: string) => {
        const result = await toggleWishlist(productId);
        if (result === 'not-logged-in') {
            showToast('Sign in to save favorites', { href: '/login', actionLabel: 'Sign In' });
        } else if (result === 'added') {
            showToast(`${productName} added to your wishlist`, { href: '/wishlist', actionLabel: 'View Wishlist' });
        } else if (result === 'error' || result === 'invalid-product') {
            showToast('Could not update your wishlist. Please try again.');
        }
    };

    return { isInWishlist, toggleWithFeedback };
}
