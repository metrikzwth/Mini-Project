/**
 * Supabase Sync Module
 * Provides dual-write helpers: localStorage remains primary, 
 * but writes are mirrored to Supabase for persistence.
 */
import { supabase } from './supabase';
import { Order, Doctor, Appointment, User } from './data';

// Helpers
const isUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// ==================== ORDERS ====================

/** Insert a single order + its items into Supabase */
export async function syncOrderToSupabase(order: Order) {
    if (!isUUID(order.patientId)) {
        console.log('[sync] Skipping order sync — mock user:', order.patientId);
        return;
    }

    try {
        // Upsert the order
        const { error: orderError } = await supabase.from('orders').upsert({
            id: order.id,
            patient_id: order.patientId,
            total_amount: order.total,
            status: order.status?.toLowerCase() || 'pending',
            shipping_address: order.deliveryAddress || '',
            payment_status: order.paymentMethod === 'wallet' ? 'paid' : 'pending',
            created_at: order.orderDate ? new Date(order.orderDate).toISOString() : new Date().toISOString(),
        }, { onConflict: 'id' });

        if (orderError) {
            console.error('[sync] Order upsert error:', orderError);
            return;
        }

        // Upsert order items
        if (order.items && order.items.length > 0) {
            const items = order.items.map((item, idx) => ({
                id: `${order.id}_item_${idx}`,
                order_id: order.id,
                medicine_id: item.medicineId,
                quantity: item.quantity,
                price_per_unit: item.price,
            }));

            const { error: itemsError } = await supabase.from('order_items').upsert(items, { onConflict: 'id' });
            if (itemsError) {
                console.error('[sync] Order items upsert error:', itemsError);
            }
        }

        console.log('[sync] Order synced to Supabase:', order.id);
    } catch (err) {
        console.error('[sync] Order sync failed:', err);
    }
}

/** Update just the status of an order in Supabase */
export async function syncOrderStatusToSupabase(orderId: string, status: string) {
    try {
        const { error } = await supabase.from('orders').update({
            status: status.toLowerCase(),
        }).eq('id', orderId);

        if (error) {
            console.error('[sync] Order status update error:', error);
        } else {
            console.log('[sync] Order status synced:', orderId, status);
        }
    } catch (err) {
        console.error('[sync] Order status sync failed:', err);
    }
}

/** Delete an order from Supabase */
export async function deleteOrderFromSupabase(orderId: string) {
    try {
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) console.error('[sync] Order delete error:', error);
        else console.log('[sync] Order deleted from Supabase:', orderId);
    } catch (err) {
        console.error('[sync] Order delete failed:', err);
    }
}


// ==================== DOCTORS ====================

/** Sync a doctor record to Supabase */
export async function syncDoctorToSupabase(doctor: Doctor, linkedUserId?: string) {
    // We can only sync if the doctor has a UUID-linked user
    const doctorProfileId = linkedUserId || doctor.id;
    if (!isUUID(doctorProfileId)) {
        console.log('[sync] Skipping doctor sync — mock ID:', doctorProfileId);
        return;
    }

    try {
        const { error } = await supabase.from('doctors').upsert({
            id: doctorProfileId,
            specialization: doctor.specialization,
            experience: doctor.experience,
            consultation_fee: doctor.fee,
            available: doctor.isActive,
            image_url: doctor.image || null,
            about: doctor.name,
        }, { onConflict: 'id' });

        if (error) console.error('[sync] Doctor upsert error:', error);
        else console.log('[sync] Doctor synced to Supabase:', doctor.name);
    } catch (err) {
        console.error('[sync] Doctor sync failed:', err);
    }
}

/** Delete a doctor from Supabase */
export async function deleteDoctorFromSupabase(doctorProfileId: string) {
    if (!isUUID(doctorProfileId)) return;
    try {
        const { error } = await supabase.from('doctors').delete().eq('id', doctorProfileId);
        if (error) console.error('[sync] Doctor delete error:', error);
        else console.log('[sync] Doctor deleted from Supabase:', doctorProfileId);
    } catch (err) {
        console.error('[sync] Doctor delete failed:', err);
    }
}


// ==================== PROFILES (PATIENTS) ====================

/** Sync a user profile to Supabase */
export async function syncProfileToSupabase(user: User) {
    if (!isUUID(user.id)) {
        console.log('[sync] Skipping profile sync — mock user:', user.id);
        return;
    }

    try {
        const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.name,
            role: user.role,
            phone: user.phone || null,
            address: user.address || null,
        }, { onConflict: 'id' });

        if (error) console.error('[sync] Profile upsert error:', error);
        else console.log('[sync] Profile synced to Supabase:', user.email);
    } catch (err) {
        console.error('[sync] Profile sync failed:', err);
    }
}

/** Delete a profile from Supabase */
export async function deleteProfileFromSupabase(userId: string) {
    if (!isUUID(userId)) return;
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) console.error('[sync] Profile delete error:', error);
        else console.log('[sync] Profile deleted from Supabase:', userId);
    } catch (err) {
        console.error('[sync] Profile delete failed:', err);
    }
}


// ==================== APPOINTMENTS ====================

/** Sync an appointment to Supabase */
export async function syncAppointmentToSupabase(appt: Appointment) {
    if (!isUUID(appt.patientId) || !isUUID(appt.doctorId)) {
        console.log('[sync] Skipping appointment sync — mock IDs');
        return;
    }

    try {
        const { error } = await supabase.from('appointments').upsert({
            id: appt.id,
            patient_id: appt.patientId,
            doctor_id: appt.doctorId,
            date: appt.date,
            time: appt.time,
            status: appt.status,
            consultation_fee: appt.fee || null,
            notes: appt.notes || null,
        }, { onConflict: 'id' });

        if (error) console.error('[sync] Appointment upsert error:', error);
        else console.log('[sync] Appointment synced to Supabase:', appt.id);
    } catch (err) {
        console.error('[sync] Appointment sync failed:', err);
    }
}

/** Delete an appointment from Supabase */
export async function deleteAppointmentFromSupabase(apptId: string) {
    try {
        const { error } = await supabase.from('appointments').delete().eq('id', apptId);
        if (error) console.error('[sync] Appointment delete error:', error);
        else console.log('[sync] Appointment deleted from Supabase:', apptId);
    } catch (err) {
        console.error('[sync] Appointment delete failed:', err);
    }
}
