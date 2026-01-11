import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReservationService } from './ReservationService';
import { fetchWithAuth } from '../api/client';

// Mock fetchWithAuth
vi.mock('../api/client', () => ({
  fetchWithAuth: vi.fn(),
  BASE_URL: 'https://is.mendelu.cz'
}));

describe('ReservationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should construct form data correctly for submission', async () => {
    const mockData = {
      roomName: 'individuální studovna 1',
      date: '01.01.2026',
      timeFrom: '10:00',
      timeTo: '11:00',
      name: 'John Doe',
      uisId: 'xjohn',
      email: 'xjohn@mendelu.cz'
    };

    // Mock HTML response for token fetching
    const mockHtml = `
      <form>
        <input name="form_id" value="test_form_id" />
        <input name="unique_id" value="test_unique_id" />
        <input type="text" name="as-12345" value="30" />
      </form>
    `;

    (fetchWithAuth as any)
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockHtml) }) // First call: GET tokens
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('ok') });   // Second call: POST submission

    const result = await ReservationService.submitReservation(mockData);

    expect(result.success).toBe(true);
    
    // Verify first call (GET tokens)
    expect(fetchWithAuth).toHaveBeenNthCalledWith(1,
      'https://uvis.mendelu.cz/rezervace-studoven-knihovny-a',
      expect.objectContaining({ method: 'GET' })
    );

    // Verify second call (POST submission)
    expect(fetchWithAuth).toHaveBeenNthCalledWith(2,
      'https://uvis.mendelu.cz/rezervace-studoven-knihovny-a',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
    );

    const callArgs = (fetchWithAuth as any).mock.calls[1][1];
    const body = new URLSearchParams(callArgs.body);
    
    expect(body.get('field-7603')).toBe(mockData.roomName);
    expect(body.get('datum')).toBe(mockData.date);
    expect(body.get('field-7607')).toBe(mockData.name);
    expect(body.get('as-12345')).toBe('30'); // Dynamic field name
    expect(body.get('form_id')).toBe('test_form_id');
    expect(body.get('unique_id')).toBe('test_unique_id');
  });

  it('should return error if token fetch fails', async () => {
    (fetchWithAuth as any).mockResolvedValue({ ok: false, status: 500 }); // Token fetch fails
    
    const result = await ReservationService.submitReservation({
      roomName: 'test',
      date: 'test',
      timeFrom: 'test',
      timeTo: 'test',
      name: 'test',
      uisId: 'test',
      email: 'test'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Nepodařilo se načíst formulář');
  });

  it('should return error if submission fails', async () => {
    const mockHtml = `
      <form>
        <input name="form_id" value="id" />
        <input name="unique_id" value="uid" />
        <input type="text" name="as-1" value="1" />
      </form>
    `;

    (fetchWithAuth as any)
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockHtml) }) // Tokens OK
      .mockResolvedValueOnce({ ok: false, status: 500 });                         // Submission Fails

    const result = await ReservationService.submitReservation({
      roomName: 'test',
      date: 'test',
      timeFrom: 'test',
      timeTo: 'test',
      name: 'test',
      uisId: 'test',
      email: 'test'
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Chyba serveru (500)');
  });
});
