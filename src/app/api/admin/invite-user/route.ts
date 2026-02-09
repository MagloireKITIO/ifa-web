import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminSupabaseClient } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  // 🔒 SÉCURITÉ: Vérifier que l'utilisateur est admin
  const authResult = await requireAdmin();
  if ('error' in authResult) {
    return authResult.error;
  }

  // L'utilisateur est admin, on peut continuer
  const { user: adminUser } = authResult;

  try {
    // Créer le client admin APRÈS vérification
    const supabaseAdmin = createAdminSupabaseClient();

    const body = await request.json();
    const { email, full_name, role, center_id, house_church_id } = body;

    // Validation
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'Données incomplètes' },
        { status: 400 }
      );
    }

    // Validation selon le rôle
    if (role === 'center_lead' && !center_id) {
      return NextResponse.json(
        { success: false, error: 'Un responsable de centre doit être assigné à un centre' },
        { status: 400 }
      );
    }

    if (role === 'house_lead' && (!house_church_id || !center_id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Un responsable d'assemblée doit être assigné à une assemblée et un centre",
        },
        { status: 400 }
      );
    }

    // Inviter l'utilisateur via l'API Admin
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/set-password`,
      });

    if (inviteError) {
      return NextResponse.json(
        { success: false, error: inviteError.message },
        { status: 500 }
      );
    }

    if (!inviteData.user) {
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'invitation" },
        { status: 500 }
      );
    }

    // Mettre à jour le profil avec le rôle et les assignations
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        role,
        center_id: center_id || null,
        house_church_id: house_church_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteData.user.id);

    if (profileError) {
      return NextResponse.json(
        { success: false, error: `Erreur profil: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 📝 Audit log: Tracer la création d'utilisateur
    try {
      await supabaseAdmin.from('audit_logs').insert({
        user_id: adminUser.id,
        action: 'invite_user',
        resource_type: 'user',
        resource_id: inviteData.user.id,
        details: {
          invited_email: email,
          invited_role: role,
          invited_full_name: full_name,
        },
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      // Ne pas bloquer la requête si le log échoue
      console.error('Failed to create audit log:', auditError);
    }

    return NextResponse.json({ success: true, user: inviteData.user });
  } catch (error: any) {
    console.error('Error in invite-user API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
