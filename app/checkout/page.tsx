"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Tag, ShoppingCart, Minus, Plus, Trash2, UserPlus } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { courses } from '@/data/courses';
import { useRouter } from 'next/navigation';
import { preparePaymentData, sendPaymentRequest, handlePaymentResponse, currencyFormatter, sendSePayPaymentRequest, prepareSePayPaymentData } from '@/lib/payment-utils';
import SePayPaymentQR from '@/components/SePayPaymentQR';
import { SePayPaymentResponse } from '@/types/sepay';
import { useLanguage } from '@/lib/LanguageContext';
import { validateCartAccountConsistency } from '@/lib/sepay-config';
import { getCourseDetailBySlug } from '@/lib/services/courseService';
import { processFreeCheckout } from './mockPaymentAction';

export default function CheckoutPage() {
  const { t } = useLanguage();

  // Feature flag for the promotional "Buy La Chinh Minh get Thuong Hieu Cua Ban free"
  const ENABLE_PROMO_THUONG_HIEU_CUA_BAN = true;
  const promoCourse = courses.find(c => c.slug === 'thuong-hieu-cua-ban');
  const router = useRouter();
  const { items, getTotalPrice, clearCart, removeFromCart, updateQuantity } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: '',
    birthdate: '',
    gender: '',
    address: '',
    note: '',
    previousCourse: ''
  });
  const [discountCode, setDiscountCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sepayPaymentData, setSepayPaymentData] = useState<SePayPaymentResponse | null>(null);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [showVisaQR, setShowVisaQR] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  // Checkout steps
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment'>('info');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qr' | 'card' | null>(null);
  // VAT invoice
  const [wantVatInvoice, setWantVatInvoice] = useState(false);
  const [vatData, setVatData] = useState({
    companyName: '',
    taxCode: '',
    companyAddress: '',
    companyEmail: '',
  });
  const [showVatTerms, setShowVatTerms] = useState(false);
  const [thirtyDayCheckoutImage, setThirtyDayCheckoutImage] = useState<string | null>(null);

  const [vatRate, setVatRate] = useState(0.08);
  const [isVat10Percent, setIsVat10Percent] = useState(false);

  useEffect(() => {
    // Tự động tính VAT 10% từ ngày 18/05/2026
    const _isVat10Percent = new Date() >= new Date('2026-05-18T00:00:00+07:00');
    setIsVat10Percent(_isVat10Percent);
    setVatRate(_isVat10Percent ? 0.1 : 0.08);
  }, []);

  useEffect(() => {
    const hasThirtyDayCourse = items.some((item) => item.slug === 'thu-thach-30-ngay');
    if (!hasThirtyDayCourse) return;

    const fetchCourseData = async () => {
      const detail = await getCourseDetailBySlug('thu-thach-30-ngay');
      if (detail && detail.program?.image) {
        setThirtyDayCheckoutImage(detail.program.image);
      }
    };
    fetchCourseData();
  }, [items]);

  // Prevent leaving page during payment process
  useEffect(() => {
    if (!showVisaQR && !showPaymentQR) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Trap back button and show custom modal
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      setPendingUrl(null);
      setShowLeaveConfirm(true);
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showVisaQR, showPaymentQR]);

  const subtotal = getTotalPrice();
  const discountAmount = discountType === 'percentage'
    ? subtotal * (discount / 100)
    : discount;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = Math.round(afterDiscount * vatRate);
  const total = afterDiscount + vatAmount;

  const handleApplyDiscount = () => {
    const code = discountCode.trim().toUpperCase();

    // TEMPORARY PROMO LOGIC
    const hasReviewCourse = items.some(item => item.slug === 'la-chinh-minh-review');
    if (code === 'LCMREVIEWFREE' && hasReviewCourse) {
      setDiscount(100);
      setDiscountType('percentage');
      return;
    }

    const hasThirtyDayCoursePromoApply = items.some(item => item.slug === 'thu-thach-30-ngay');
    if (code === 'NEDU30DAYFREE_SECRET2026' && hasThirtyDayCoursePromoApply) {
      setDiscount(100);
      setDiscountType('percentage');
      return;
    }

    // Check if cart contains "Là Chính Mình 04" course
    const hasLaChinhMinh4 = items.some(item =>
      item.id === 2
    );

    // ... handleApplyDiscount logic ...
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!agreed) {
      setErrors(['Vui lòng đồng ý với điều khoản sử dụng']);
      return;
    }

    // 1. Process Telegram username to ensure @ prefix
    let telegram = formData.telegram.trim();
    if (telegram && !telegram.startsWith('@')) {
      telegram = `@${telegram}`;
    }

    // 2. Validate required fields with specific error messages
    const validationErrors: string[] = [];
    if (!formData.name.trim()) validationErrors.push('Vui lòng nhập họ tên');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      validationErrors.push('Vui lòng nhập địa chỉ email');
    } else if (!emailRegex.test(formData.email)) {
      validationErrors.push('Địa chỉ email không hợp lệ');
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      validationErrors.push('Vui lòng nhập số điện thoại');
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      validationErrors.push('Số điện thoại phải có 10 hoặc 11 chữ số');
    }

    if (!telegram) validationErrors.push('Vui lòng nhập Telegram username');
    if (!formData.birthdate) validationErrors.push('Vui lòng chọn ngày sinh');
    if (!formData.gender) validationErrors.push('Vui lòng chọn giới tính');

    const hasReviewCourse = items.some(item => item.slug === 'la-chinh-minh-review');
    if (hasReviewCourse && !formData.previousCourse) {
      validationErrors.push('Vui lòng chọn khóa học bạn quay về');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      // Scroll to error display
      setTimeout(() => {
        const errorDiv = document.querySelector('.bg-red-50');
        if (errorDiv) {
          errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    // --- TEMPORARY PROMO LOGIC ---
    const code = discountCode.trim().toUpperCase();
    const hasReviewCoursePromo = items.some(item => item.slug === 'la-chinh-minh-review');
    const hasThirtyDayCoursePromo = items.some(item => item.slug === 'thu-thach-30-ngay');
    
    if ((code === 'LCMREVIEWFREE' && hasReviewCoursePromo) || (code === 'NEDU30DAYFREE_SECRET2026' && hasThirtyDayCoursePromo)) {
      setIsLoading(true);
      try {
        let courseName = items.map(item => t(item.title)).join(', ');
        const maxUses = code === 'LCMREVIEWFREE' ? 3 : 9999;
        
        const result = await processFreeCheckout({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          telegram: telegram,
          dob: formData.birthdate,
          gender: formData.gender,
          address: formData.address,
          note: formData.note,
          previousCourse: formData.previousCourse,
          courseName: courseName
        }, code, maxUses);

        if (result.success) {
           clearCart();
           const params = new URLSearchParams({
             status: 'success',
             paymentMethod: 'sepay',
             orderCode: result.orderCode || '',
             amount: '0',
           });
           router.push(`/payment-success?${params.toString()}`);
           return;
        } else {
           setErrors([result.message || 'Lỗi không xác định']);
           setIsLoading(false);
           return;
        }
      } catch (error: any) {
        setErrors([`Lỗi khi áp dụng mã: ${error.message}`]);
        setIsLoading(false);
        return;
      }
    }
    // --- END TEMPORARY PROMO LOGIC ---

    // Move to payment step
    setCheckoutStep('payment');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleFinalPayment = async () => {
    // Validate VAT if checked
    if (wantVatInvoice) {
      const vatErrors: string[] = [];
      if (!vatData.companyName.trim()) vatErrors.push('Vui lòng nhập tên doanh nghiệp');
      if (!vatData.taxCode.trim()) vatErrors.push('Vui lòng nhập mã số thuế');
      if (!vatData.companyAddress.trim()) vatErrors.push('Vui lòng nhập địa chỉ doanh nghiệp');
      if (!vatData.companyEmail.trim()) vatErrors.push('Vui lòng nhập email nhận hoá đơn');
      if (vatErrors.length > 0) {
        setErrors(vatErrors);
        return;
      }
    }

    if (!selectedPaymentMethod) {
      setErrors(['Vui lòng chọn phương thức thanh toán']);
      return;
    }

    setErrors([]);
    setIsLoading(true);
    setShowPaymentQR(false);
    setShowVisaQR(false);
    setSepayPaymentData(null);

    if (selectedPaymentMethod === 'card') {
      setTimeout(() => {
        setIsLoading(false);
        setShowVisaQR(true);
        setCheckoutStep('info'); // Reset step behind the QR if needed
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }, 500);
      return;
    }

    try {
      // Calculate total amount for all items in cart (after discount + VAT)
      const finalAmount = total;

      // Get all program IDs from cart items
      const programIds = items.map(item => (item.paymentId || item.id).toString());

      // Validate cart has no mixed bank accounts
      const cartValidation = validateCartAccountConsistency(programIds);
      if (!cartValidation.isValid) {
        setErrors([
          'Giỏ hàng chứa các khoá học thuộc tài khoản thanh toán khác nhau. Vui lòng tách thành các đơn hàng riêng biệt để thanh toán.'
        ]);
        setIsLoading(false);
        return;
      }

      // Construct course names string (e.g. "Course A, Course B")
      // Nếu có khoá "thu-thach-30-ngay" thì courseName là "THỬ THÁCH 30 NGÀY"
      let courseName = items.map(item => t(item.title)).join(', ');
      if (items.some(item => item.slug === 'thu-thach-30-ngay')) {
        courseName = 'THỬ THÁCH 30 NGÀY';
      }

      // Determine coupon code used (if any discount applied)
      const appliedCouponCode = discount > 0 ? discountCode : '';

      // Prepare SePay payment data with processed telegram
      let telegram = formData.telegram.trim();
      if (telegram && !telegram.startsWith('@')) {
        telegram = `@${telegram}`;
      }
      const sepayData = prepareSePayPaymentData(
        { ...formData, telegram },
        finalAmount,
        undefined, // No single programId for checkout
        programIds, // Use programIds for multiple courses
        courseName,
        appliedCouponCode,
        referralCode,
        wantVatInvoice ? vatData : undefined
      );

      console.log('Sending SePay payment request:', sepayData);

      // Send SePay payment request
      const paymentResponse = await sendSePayPaymentRequest(sepayData);

      if (paymentResponse.error || !paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Không thể tạo thanh toán');
      }

      if (paymentResponse.qrCodeUrl) {
        // Show QR code payment UI
        setSepayPaymentData(paymentResponse);
        setShowPaymentQR(true);
        setCheckoutStep('info'); // Reset step behind QR
        // Scroll to QR code
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error('Không nhận được QR code từ hệ thống thanh toán');
      }

    } catch (error) {
      console.error('Payment submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định';
      setErrors([`Lỗi khi gửi thông tin: ${errorMessage}`]);
      alert(`Lỗi khi gửi thông tin: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    // Clear cart and redirect to success page
    clearCart();

    const params = new URLSearchParams({
      status: 'success',
      paymentMethod: selectedPaymentMethod || 'sepay',
    });

    if (sepayPaymentData?.orderCode) {
      params.set('orderCode', sepayPaymentData.orderCode);
    }

    if (typeof sepayPaymentData?.amount === 'number') {
      params.set('amount', String(sepayPaymentData.amount));
    }

    router.push(`/payment-success?${params.toString()}`);
  };

  const handlePaymentFailed = () => {
    setErrors(['Thanh toán thất bại. Vui lòng thử lại.']);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'telegram') {
      // Strip leading @ if user types it, because we have a fixed @ span in UI
      const cleanValue = value.replace(/^@+/, '');
      setFormData(prev => ({ ...prev, [field]: cleanValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="override-header-spacing">
        <div className="min-h-screen bg-background-secondary py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center py-16">
              <h1 className="text-3xl font-bold mb-4 text-text-primary">{t("cart.empty_title")}</h1>
              <Link
                href="/program"
                className="btn-primary"
              >
                <ArrowLeft className="w-5 h-5" />
                {t("cart.continue_browsing")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="override-header-spacing">
      <div className="min-h-screen bg-[#F2F2F7] pt-8 sm:pt-12 pb-8 sm:pb-12">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          <div className="mb-6 sm:mb-8">
            {showVisaQR ? (
              <button
                onClick={() => {
                  setPendingUrl(null);
                  setShowLeaveConfirm(true);
                }}
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition text-sm sm:text-base group"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
                Hủy thanh toán và quay lại
              </button>
            ) : showPaymentQR ? (
              <button
                onClick={() => {
                  setPendingUrl(null);
                  setShowLeaveConfirm(true);
                }}
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition text-sm sm:text-base group"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
                Quay lại chọn phương thức thanh toán
              </button>
            ) : checkoutStep === 'payment' ? (
              <button
                onClick={() => setCheckoutStep('info')}
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition text-sm sm:text-base group"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
                Quay lại phần điền thông tin
              </button>
            ) : (
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition text-sm sm:text-base group"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-1" />
                {t("cart.back_to_cart")}
              </Link>
            )}
          </div>

          {/* Visa QR Code Payment */}
          {showVisaQR ? (
            <div className="mb-8 max-w-2xl mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="bg-white rounded-ios-xl shadow-ios-card p-5 sm:p-8 border border-white/40 w-full text-center">
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Quét để thanh toán bằng thẻ tín dụng</h2>
                <div className="flex flex-col items-center justify-center mb-8 space-y-6">
                  <img src="/images/payment/qr-code-visa.jpg" alt="Visa QR" className="max-w-[250px] w-full rounded-2xl shadow-sm border border-gray-100" />

                  <div className="w-full max-w-xl pt-6 border-t border-gray-100">
                    <img src="/images/payment/available-bank-code.jpg" alt="Available Banks" className="w-full rounded-lg border border-gray-100 object-contain max-h-[250px]" />
                  </div>

                  <button
                    onClick={handlePaymentComplete}
                    className="w-full sm:w-auto px-8 flex items-center justify-center bg-primary text-white font-bold py-3.5 rounded-full shadow-ios-md hover:shadow-ios-lg transition-all mx-auto active:scale-95"
                  >
                    Đã hoàn tất thanh toán
                  </button>
                </div>
              </div>
            </div>
          ) : showPaymentQR && sepayPaymentData ? (
            <div className="mb-8 max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
              <SePayPaymentQR
                paymentData={sepayPaymentData}
                onPaymentComplete={handlePaymentComplete}
                onPaymentFailed={handlePaymentFailed}
              />
            </div>
          ) : checkoutStep === 'payment' ? (() => {
            const isVatFilled = vatData.companyName.trim() && vatData.taxCode.trim() && vatData.companyAddress.trim() && vatData.companyEmail.trim();
            return (
              <div className="mb-8 max-w-2xl mx-auto animate-in fade-in zoom-in duration-300 w-full">
                <div className="bg-white rounded-ios-xl shadow-ios-card p-5 sm:p-8 border border-white/40">
                  <div className="flex justify-center mb-8 border-b border-gray-100 pb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary text-center">Thanh toán & Hoá đơn</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      {/* QR Payment Option */}
                      <div
                        className={`flex items-center gap-3 p-4 rounded-ios-lg border-2 cursor-pointer transition-all duration-200 ${selectedPaymentMethod === 'qr'
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        onClick={() => setSelectedPaymentMethod('qr')}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === 'qr'}
                          onChange={() => setSelectedPaymentMethod('qr')}
                          className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                        />
                        <div>
                          <span className="text-base font-semibold text-text-primary">Thanh toán QR (Chuyển khoản)</span>
                        </div>
                      </div>

                      {/* Card Payment Option */}
                      <div
                        className={`flex items-center gap-3 p-4 rounded-ios-lg border-2 cursor-pointer transition-all duration-200 ${selectedPaymentMethod === 'card'
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        onClick={() => setSelectedPaymentMethod('card')}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === 'card'}
                          onChange={() => setSelectedPaymentMethod('card')}
                          className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                        />
                        <div>
                          <span className="text-base font-semibold text-text-primary">Thanh toán thẻ tín dụng</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="flex flex-col">
                        <label className="flex items-start cursor-pointer hover:bg-gray-50 p-2 -ml-2 rounded-lg transition-colors w-max">
                          <input
                            type="checkbox"
                            checked={wantVatInvoice}
                            onChange={(e) => setWantVatInvoice(e.target.checked)}
                            className="mt-1 mr-3 w-5 h-5 text-primary rounded focus:ring-primary border-gray-300 cursor-pointer"
                          />
                          <span className="text-base font-semibold text-text-primary">Xuất hoá đơn GTGT (VAT)</span>
                        </label>
                        <p className="text-sm text-text-secondary ml-8">
                          Vui lòng xem <button type="button" onClick={() => setShowVatTerms(true)} className="text-primary hover:underline font-medium cursor-pointer">điều khoản xuất hóa đơn</button>
                        </p>
                      </div>

                      {/* VAT Invoice Fields */}
                      {wantVatInvoice && (
                        <div className="mt-4 space-y-4 p-5 bg-gray-50 rounded-ios-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div>
                            <label className="block text-text-primary font-semibold mb-1.5 text-sm ml-1">
                              Tên doanh nghiệp <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="VD: Công ty TNHH ABC"
                              value={vatData.companyName}
                              onChange={(e) => setVatData(prev => ({ ...prev, companyName: e.target.value }))}
                              className="w-full bg-white border border-gray-200 rounded-ios-md px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-text-primary font-semibold mb-1.5 text-sm ml-1">
                              Mã số thuế <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="VD: 0123456789"
                              value={vatData.taxCode}
                              onChange={(e) => setVatData(prev => ({ ...prev, taxCode: e.target.value }))}
                              className="w-full bg-white border border-gray-200 rounded-ios-md px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-text-primary font-semibold mb-1.5 text-sm ml-1">
                              Địa chỉ doanh nghiệp <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
                              value={vatData.companyAddress}
                              onChange={(e) => setVatData(prev => ({ ...prev, companyAddress: e.target.value }))}
                              className="w-full bg-white border border-gray-200 rounded-ios-md px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-text-primary font-semibold mb-1.5 text-sm ml-1">
                              Email nhận hoá đơn <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              placeholder="VD: ketoan@abc.vn"
                              value={vatData.companyEmail}
                              onChange={(e) => setVatData(prev => ({ ...prev, companyEmail: e.target.value }))}
                              className="w-full bg-white border border-gray-200 rounded-ios-md px-3 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Error Display */}
                    {errors.length > 0 && (
                      <div className="mt-6 bg-red-50 border border-red-200 rounded-ios-lg p-4 animate-shake">
                        <h4 className="text-red-800 font-semibold mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Lỗi:
                        </h4>
                        <ul className="list-disc list-inside text-red-700 ml-2">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Proceed Button */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                      <button
                        type="button"
                        onClick={handleFinalPayment}
                        disabled={isLoading}
                        className="w-full sm:w-auto min-w-[200px] flex items-center justify-center bg-primary text-white font-bold py-3.5 px-6 rounded-full shadow-ios-md hover:shadow-ios-lg hover:brightness-105 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-300 text-base ios-haptic-active"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t("checkout.processing")}
                          </div>
                        ) : (
                          'Thanh toán'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2">
                  {/* Cart Items Summary - Integrated from Step 2 style but simplified */}
                  <div className="bg-white rounded-ios-xl shadow-ios-card p-5 sm:p-8 mb-6 border border-white/40">
                    <h2 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
                        <ShoppingCart size={16} />
                      </span>
                      {t("checkout.selected_courses")}
                    </h2>
                    <div className="space-y-6">
                      {items.map((item) => {
                        const itemImage = item.slug === 'thu-thach-30-ngay'
                          ? (thirtyDayCheckoutImage && thirtyDayCheckoutImage !== '' ? thirtyDayCheckoutImage : '/course/30days_desktop.png')
                          : (item.heroImage || '/course/30days_desktop.png');

                        return (
                          <div key={item.id} className="pb-6 border-b last:border-b-0 border-gray-100">
                            <div className="flex flex-col md:flex-row gap-4 relative z-10">
                              <img
                                src={itemImage}
                                alt={t(item.title)}
                                className="w-full md:w-[160px] aspect-video object-cover rounded-ios-lg shadow-sm shrink-0 relative z-10 bg-white"
                                onError={e => { e.currentTarget.src = '/course/30days_desktop.png'; }}
                              />

                              <div className="flex-1 flex flex-col justify-center">
                                <div className="flex items-start justify-between gap-3 mb-1">
                                  <h3 className="text-lg font-bold text-text-primary">{t(item.title)}</h3>
                                  <button
                                    type="button"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-8 w-8 rounded-full flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                    aria-label={`Xóa ${t(item.title)} khỏi giỏ hàng`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-text-secondary mb-2 text-sm">{item.category.map(c => t(c)).join(', ')}</p>
                                <div className="flex items-center justify-between mt-auto">
                                  <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden h-9">
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="h-full w-9 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors"
                                      aria-label={`Giảm số lượng ${t(item.title)}`}
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="h-full min-w-[2.25rem] px-2 flex items-center justify-center text-sm font-semibold text-text-primary border-x border-gray-200">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="h-full w-9 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-gray-50 transition-colors"
                                      aria-label={`Tăng số lượng ${t(item.title)}`}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="price text-lg font-bold text-primary">
                                    {item.price.currency === 'VNĐ'
                                      ? currencyFormatter.format(parseInt(item.price.amount.replace(/\./g, '')) * item.quantity)
                                      : `${item.price.currency} ${item.price.amount}`
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Gift Item for 'la-chinh-minh' */}
                            {item.slug === 'la-chinh-minh' && ENABLE_PROMO_THUONG_HIEU_CUA_BAN && promoCourse && (
                              <div className="flex mt-4 relative md:ml-8">
                                <div className="hidden md:block absolute -top-8 left-0 w-0.5 h-16 bg-gray-300 rounded-full"></div>
                                <div className="flex flex-col md:flex-row gap-4 md:ml-6 flex-1 items-center">
                                  <img
                                    src={promoCourse.heroImage || '/images/programs/thuong-hieu-cua-ban.jpg'}
                                    alt={t(promoCourse.title)}
                                    className="w-full md:w-[128px] aspect-video object-cover rounded-md shadow-sm opacity-90 shrink-0"
                                    onError={e => { e.currentTarget.src = '/images/programs/thuong-hieu-cua-ban.jpg'; }}
                                  />
                                  <div className="flex-1 flex flex-col justify-center w-full">
                                    <div className="flex items-start justify-between gap-3 mb-1">
                                      <h3 className="text-base font-bold text-text-primary">{t(promoCourse.title)}</h3>
                                    </div>
                                    <p className="text-text-secondary mb-2 text-sm">{promoCourse.category.map(c => t(c)).join(', ')}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                      <div className="inline-flex items-center rounded-lg bg-gray-100 overflow-hidden h-7 px-3">
                                        <span className="text-xs font-semibold text-gray-500">x{item.quantity}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-400 line-through text-sm font-medium">
                                          {promoCourse.price.currency === 'VNĐ'
                                            ? currencyFormatter.format(parseInt(promoCourse.price.amount.replace(/\./g, '')) * item.quantity)
                                            : `${promoCourse.price.currency} ${promoCourse.price.amount}`
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Form */}
                  <div className="bg-white rounded-ios-xl shadow-ios-card p-5 sm:p-8 border border-white/40">
                    <h2 className="text-xl font-bold mb-6 text-text-primary">
                      {t("checkout.customer_info_title")}
                    </h2>

                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                            {t("checkout.form.name")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={t("checkout.form.placeholders.name")}
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active"
                          />
                        </div>

                        <div>
                          <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                            {t("checkout.form.email")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder={t("checkout.form.placeholders.email")}
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active"
                          />
                        </div>

                        <div>
                          <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                            {t("checkout.form.phone")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder={t("checkout.form.placeholders.phone")}
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active"
                          />
                        </div>

                        <div>
                          <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                            {t("checkout.form.telegram")} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder={t("checkout.form.placeholders.telegram")}
                              value={formData.telegram}
                              onChange={(e) => handleInputChange('telegram', e.target.value)}
                              className="peer w-full bg-gray-50 border border-gray-200 rounded-ios-md pl-9 pr-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 peer-focus:text-primary transition-colors">@</span>
                          </div>
                        </div>

                        {items.some(item => item.slug === 'la-chinh-minh-review') && (
                          <div className="sm:col-span-2">
                            <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                              Bạn quay về từ khóa nào? (hãy chọn khoá học gần nhất bạn đã tham gia)<span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <select
                                required
                                value={formData.previousCourse}
                                onChange={(e) => handleInputChange('previousCourse', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active"
                              >
                                <option value="">Chọn khóa học</option>
                                <option value="Money & You">Money & You</option>
                                <option value="Ignite 01">Ignite 01</option>
                                <option value="Ignite 02">Ignite 02</option>
                                <option value="Là Chính Mình 01">Là Chính Mình 01</option>
                                <option value="Là Chính Mình 02">Là Chính Mình 02</option>
                                <option value="Là Chính Mình 03">Là Chính Mình 03</option>
                                <option value="Là Chính Mình 04">Là Chính Mình 04</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                            {t("checkout.form.birthdate")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.birthdate}
                            onChange={(e) => handleInputChange('birthdate', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active"
                          />
                        </div>

                        <div>
                          <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                            {t("checkout.form.gender")} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              required
                              value={formData.gender}
                              onChange={(e) => handleInputChange('gender', e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active"
                            >
                              <option value="">{t("checkout.form.gender_options.select")}</option>
                              <option value="female">{t("checkout.form.gender_options.female")}</option>
                              <option value="male">{t("checkout.form.gender_options.male")}</option>
                              <option value="other">{t("checkout.form.gender_options.other")}</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                          {t("checkout.form.address")}
                        </label>
                        <input
                          type="text"
                          placeholder={t("checkout.form.placeholders.address")}
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active"
                        />
                      </div>

                      <div>
                        <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base ml-1">
                          {t("checkout.form.note")}
                        </label>
                        <textarea
                          rows={3}
                          placeholder={t("checkout.form.placeholders.note")}
                          value={formData.note}
                          onChange={(e) => handleInputChange('note', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-3 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base appearance-none ios-haptic-active resize-y min-h-[100px]"
                        />
                      </div>

                      <div className="flex items-start bg-blue-50/50 p-4 rounded-ios-lg border border-blue-100 mt-6">
                        <input
                          type="checkbox"
                          id="terms"
                          required
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="mt-1 mr-3 w-5 h-5 text-primary rounded focus:ring-primary border-gray-300 cursor-pointer"
                        />
                        <label htmlFor="terms" className="text-sm text-text-primary leading-relaxed">
                          {t("checkout.terms_agreement")}{' '}
                          <Link href="/policy" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                            {t("policy.title")}
                          </Link>{' '}
                          &{' '}
                          <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                            {t("terms.title")}
                          </Link>
                        </label>
                      </div>

                      {/* Error Display */}
                      {errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-ios-lg p-4 mb-6 animate-shake">
                          <h4 className="text-red-800 font-semibold mb-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Lỗi:
                          </h4>
                          <ul className="list-disc list-inside text-red-700 ml-2">
                            {errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-ios-xl shadow-ios-card p-5 sm:p-8 sticky top-24 sm:top-28 border border-white/40">
                    <h2 className="text-lg sm:text-xl font-bold mb-6 text-text-primary border-b pb-4">
                      {t("cart.summary_title")}
                    </h2>

                    {items.some(item => item.slug === 'la-chinh-minh') && (
                      <div className="mb-6">
                        <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base">
                          Mã giới thiệu (Nếu có)
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={referralCode}
                              onChange={(e) => setReferralCode(e.target.value)}
                              placeholder="Nhập mã giới thiệu"
                              className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-2 h-[44px] focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium uppercase placeholder:normal-case ios-haptic-active"
                            />
                            <UserPlus className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-text-primary font-semibold mb-2 text-sm sm:text-base">
                        {t("checkout.discount_code")}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder={t("checkout.discount_code")}
                            className="w-full bg-gray-50 border border-gray-200 rounded-ios-md px-4 py-2 h-[44px] focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium uppercase placeholder:normal-case ios-haptic-active"
                          />
                          <Tag className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyDiscount}
                          className="px-4 bg-gray-800 text-white rounded-ios-md hover:bg-black transition-all duration-300 h-[44px] font-bold text-sm shadow-sm ios-haptic-active"
                        >
                          {t("checkout.apply_btn")}
                        </button>
                      </div>
                      {discount > 0 && (
                        <div className="mt-2 text-success text-xs sm:text-sm font-bold flex items-center animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-success mr-2"></span>
                          {t("checkout.applied_discount")} {discountType === 'percentage' ? `${discount}%` : `-${currencyFormatter.format(discount)}`}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-ios-lg">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-text-secondary">{t("checkout.subtotal")}</span>
                        <span className="font-semibold">{currencyFormatter.format(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-success font-medium">{t("checkout.discount")}</span>
                          <span className="font-bold text-success">-{currencyFormatter.format(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-text-secondary">Thuế GTGT ({isVat10Percent ? '10' : '8'}%)</span>
                        <span className="font-semibold">{currencyFormatter.format(vatAmount)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3 flex justify-between text-base sm:text-lg font-bold items-center">
                        <span>{t("checkout.total")}</span>
                        <span className="price text-primary text-xl">{currencyFormatter.format(total)}</span>
                      </div>
                    </div>


                    {/* Confirm Button - only show before vat selection */}
                    {checkoutStep === 'info' && (
                      <button
                        form="checkout-form"
                        type="submit"
                        disabled={isLoading || !agreed}
                        className="w-full flex items-center justify-center bg-primary text-white font-bold py-3.5 rounded-full shadow-ios-md hover:shadow-ios-lg hover:brightness-105 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-300 text-base ios-haptic-active"
                      >
                        Chọn phương thức thanh toán
                      </button>
                    )}

                    <Link
                      href="/cart"
                      className="w-full mt-4 text-center text-gray-500 hover:text-primary font-semibold transition block text-sm sm:text-base py-2 rounded-lg hover:bg-gray-50"
                    >
                      Quay lại giỏ hàng
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )
          }
        </div>
      </div>

      {/* VAT Terms Modal */}
      {showVatTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-text-primary text-center w-full">Lưu ý về Hóa đơn điện tử/Hóa đơn VAT</h3>
              <button
                onClick={() => setShowVatTerms(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 absolute right-4 top-4"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-text-primary text-base space-y-4">
              <p>
                1. Trường hợp Khách hàng không chọn yêu cầu xuất hóa đơn hoặc chưa điền thông tin khi tiến hành thanh toán khoá học, N-Education sẽ mặc định xuất hóa đơn với thông tin người mua là "Khách lẻ không lấy hóa đơn".
              </p>
              <p>
                2. N-Education chỉ hỗ trợ xuất hóa đơn 01 (một) lần duy nhất. Khách hàng vui lòng kiểm tra kỹ và không thể thay đổi thông tin hóa đơn sau khi đã hoàn tất "Thanh toán".
              </p>
            </div>

            <div className="p-6 pb-8 flex justify-center">
              <button
                onClick={() => setShowVatTerms(false)}
                className="px-8 py-2.5 bg-[#F78D2B] text-white rounded-full font-bold hover:brightness-105 transition-all shadow-md active:scale-95"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 pt-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Xác nhận rời khỏi trang?</h3>
              <p className="text-text-secondary text-sm">
                Những thay đổi bạn vừa thực hiện có thể không được lưu lại.
              </p>
            </div>

            <div className="flex border-t border-gray-100 italic">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-4 text-text-primary font-semibold hover:bg-gray-50 transition-colors border-r border-gray-100"
              >
                Ở lại
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  if (pendingUrl) {
                    router.push(pendingUrl);
                  } else {
                    if (showVisaQR) setShowVisaQR(false);
                    if (showPaymentQR) setShowPaymentQR(false);
                  }
                }}
                className="flex-1 py-4 text-red-600 font-bold hover:bg-red-50 transition-colors"
              >
                Rời khỏi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}