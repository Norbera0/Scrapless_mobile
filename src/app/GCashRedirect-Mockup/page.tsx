
'use client';

import { useRouter } from 'next/navigation';

export default function GCashRedirectMockupPage() {
    const router = useRouter();

    const showSuccessFlow = () => {
        alert('✅ Transfer successful!\\n\\n₱120 has been moved to your #MySaveUp account.');
        // In a real app, you'd navigate somewhere after success
    };

    const closeModal = () => {
        // In a real app, this would likely go back or close a modal/webview
        router.back();
    };

    return (
        <div className="bg-gray-100 p-4 sm:p-8 flex justify-center items-start min-h-screen">
            <div className="phone-frame" style={{
                background: '#000',
                borderRadius: '30px',
                padding: '8px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                position: 'relative',
                maxWidth: '350px',
                margin: '0 auto',
            }}>
                <div className="phone-screen" style={{
                    background: 'white',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    minHeight: '600px',
                    position: 'relative',
                }}>

                    {/* Mock GCash Header */}
                    <div style={{
                        backgroundColor: '#0077FF',
                        color: 'white',
                        padding: '14px',
                        textAlign: 'center',
                        fontWeight: 600,
                    }}>
                        GCash Transfer (Mockup)
                    </div>

                    {/* Main Content */}
                    <div className="screen-content" style={{ padding: '20px' }}>

                        {/* Amount */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>₱120</div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>Amount to be transferred</div>
                        </div>

                        {/* Transaction Details Card */}
                        <div style={{
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '24px',
                        }}>
                            <div className="transfer-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#6b7280' }}>From</span>
                                <span style={{ fontWeight: 600 }}>GCash Wallet (₱1,560)</span>
                            </div>
                            <div className="transfer-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#6b7280' }}>To</span>
                                <span style={{ fontWeight: 600 }}>Scrapless #MySaveUp</span>
                            </div>
                            <div className="transfer-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Fee</span>
                                <span style={{ fontWeight: 600, color: '#059669' }}>FREE</span>
                            </div>
                        </div>

                        {/* Impact Box */}
                        <div style={{
                            background: '#ECFDF5',
                            border: '1px solid #BBF7D0',
                            borderRadius: '10px',
                            padding: '14px',
                            marginBottom: '24px',
                        }}>
                            <div style={{ fontWeight: 600, color: '#166534', marginBottom: '6px' }}>🌱 This Week's Impact</div>
                            <div style={{ fontSize: '14px', color: '#15803D', lineHeight: 1.5 }}>
                                • 2kg rice waste prevented<br />
                                • 1.5kg CO₂ emissions avoided<br />
                                • Equivalent to ₱120 saved
                            </div>
                        </div>

                        {/* Buttons (Mock GCash style) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button style={{
                                background: '#0077FF',
                                color: 'white',
                                padding: '14px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                            }} onClick={showSuccessFlow}>
                                Confirm
                            </button>
                            <button style={{
                                background: '#F3F4F6',
                                color: '#374151',
                                padding: '14px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                            }} onClick={closeModal}>
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
