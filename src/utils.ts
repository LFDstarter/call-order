// Utilitaires pour le SaaS Restaurant Orders
import { v4 as uuidv4 } from 'uuid';

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Génère un token de session aléatoirement
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/**
 * Valide une adresse email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formate une date pour l'affichage
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Hash simple pour les mots de passe (remplace bcrypt pour Cloudflare Workers)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'restaurant-orders-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Vérifie un mot de passe
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Parse les fonctionnalités d'un plan depuis JSON
 */
export function parseFeatures(featuresJson: string): string[] {
  try {
    return JSON.parse(featuresJson);
  } catch {
    return [];
  }
}

/**
 * Génère une couleur aléatoire pour les guichets
 */
export function generateRandomColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316'  // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Sanitise une entrée utilisateur
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"']/g, '');
}

/**
 * Valide un numéro de commande
 */
export function validateCommandNumber(number: string): boolean {
  // Numéro de 1 à 4 caractères, chiffres et lettres seulement
  return /^[A-Za-z0-9]{1,4}$/.test(number);
}

/**
 * Crée une réponse API standardisée
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string
) {
  return {
    success,
    ...(data && { data }),
    ...(message && { message }),
    ...(error && { error })
  };
}

/**
 * Calcule l'expiration d'une session (7 jours)
 */
export function getSessionExpiration(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}