import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route : Vérification du CAPTCHA hCaptcha
 *
 * 🔒 SÉCURITÉ:
 * - Vérifie le token CAPTCHA côté serveur
 * - Empêche les bots d'utiliser le formulaire de sourcing
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token CAPTCHA manquant' },
        { status: 400 }
      );
    }

    // Vérifier le token avec l'API hCaptcha
    const verifyResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `response=${token}&secret=${process.env.HCAPTCHA_SECRET_KEY}`,
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'CAPTCHA invalide',
          details: verifyData['error-codes'],
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying CAPTCHA:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification du CAPTCHA' },
      { status: 500 }
    );
  }
}
