"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { courses as coursesData } from "@/data/courses";
import { useLanguage } from "@/lib/LanguageContext";
import { useCart } from "@/lib/cart-context";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getCourseDetailBySlug } from "@/lib/services/courseService";
import { CourseDetail } from "@/lib/types/course";


const filters = [
  { id: "all", label: "Tất cả" },
  { id: "offline", label: "Offline" },
  { id: "online", label: "Online" },
  { id: "business", label: "Doanh nghiệp" },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 10,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
    }
  },
};

const CourseCardSkeleton = () => (
  <div className="w-[270px] md:w-[420px] flex-shrink-0 snap-center flex flex-col justify-between animate-pulse">
    <div className="w-full aspect-video bg-gray-200 rounded-[30px]" />
    <div className="flex flex-col items-center text-center w-full max-w-full pb-10 flex-grow pt-4">
      <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-60 bg-gray-200 rounded mb-4" />
      <div className="h-6 w-24 bg-gray-200 rounded mt-4" />
      <div className="flex gap-4 mt-6">
        <div className="h-10 w-28 bg-gray-200 rounded-full" />
        <div className="h-4 w-20 bg-gray-200 rounded mt-2" />
      </div>
    </div>
  </div>
);

const orderedSlugs = [
  "la-chinh-minh",
  "la-chinh-minh-review",
  "thu-thach-30-ngay",
  "cuoc-song-cua-ban",
  "thuong-hieu-cua-ban",
  "suc-manh-vo-han"
];

const sortedCoursesData = [...coursesData].sort((a, b) => {
  const indexA = orderedSlugs.indexOf(a.slug);
  const indexB = orderedSlugs.indexOf(b.slug);
  if (indexA === -1 && indexB === -1) return 0;
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
});

export default function ProgramPage() {
  const [courses, setCourses] = useState(sortedCoursesData);
  const [filter, setFilter] = useState("all");
  const router = useRouter();
  const { t } = useLanguage();
  const { addToCart, buyNow, items } = useCart();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDynamicData() {
      setIsLoading(true);
      try {
        // Fetch updated data for 30-day challenge (ID 82)
        const dynamicData = await getCourseDetailBySlug("thu-thach-30-ngay");

        if (dynamicData) {
          setCourses(prev => prev.map(course => {
            if (course.slug === 'thu-thach-30-ngay') {
              // Extract data from ID 82 record
              const p = dynamicData.program;
              const d = dynamicData.description;

              return {
                ...course,
                title: d?.program_name || p?.program_name || course.title,
                mission: d?.short_description || course.mission,
                heroImage: p?.image || course.heroImage,
                price: {
                  ...course.price,
                  amount: p?.program_price ? p.program_price.toLocaleString('vi-VN') : course.price.amount
                },
                info: {
                  ...course.info,
                  topic: p?.hashtag || d?.topic || course.info.topic,
                }
              };
            }
            return course;
          }));
        }
      } catch (error) {
        console.error("Error updating dynamic course data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDynamicData();
  }, []);

  const navigateToCourse = (mode: string, slug: string) => {
    router.push(`/program-${mode}/${slug}`);
  };

  const [showPopup, setShowPopup] = useState(false);
  const [popupCourse, setPopupCourse] = useState<any>(null);
  const popupTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleAddToCart = (course: any) => {
    // Check if course already exists in cart
    const existingItem = items.find(item => item.id === course.id);
    if (existingItem && existingItem.quantity >= 10) {
      toast.warning(t("program_page.toast.max_quantity_reached"), {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    addToCart(course);
    setPopupCourse(course);
    setShowPopup(true);
    if (popupTimeout.current) clearTimeout(popupTimeout.current);
    popupTimeout.current = setTimeout(() => {
      setShowPopup(false);
      setPopupCourse(null);
    }, 3500);
  };

  const getCourseActionState = (slug: string) => {
    const courseData = courses.find((c) => c.slug === slug);
    const isDisabled = courseData?.registrationOpen === false;

    return {
      isDisabled,
      label: isDisabled
        ? "Đã đóng đăng ký"
        : t("program_page.card.register"),
      secondaryLabel: isDisabled
        ? "Ngừng thanh toán"
        : t("program_page.card.learn_more"),
    };
  };

  const filteredCourses = useMemo(() => {
    if (filter === "all") return courses;
    if (filter === "offline") return courses.filter((c) => c.mode === "offline");
    if (filter === "online") return courses.filter((c) => c.mode === "online");
    return courses.filter((c) => c.category.includes("Doanh nghiệp"));
  }, [filter, courses]);

  const updateScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Update scroll button states when filter changes
  useEffect(() => {
    // Reset scroll position to start when filter changes
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
    // Update button states after a brief delay to allow DOM to update
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);
    return () => clearTimeout(timer);
  }, [filteredCourses]);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      // Calculate scroll amount based on viewport width
      // Mobile: 270px card + 16px gap = 286px
      // Desktop (md and up): 420px card + 32px gap = 452px
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? 286 : 452;

      const newScrollLeft = direction === 'left'
        ? carouselRef.current.scrollLeft - scrollAmount
        : carouselRef.current.scrollLeft + scrollAmount;

      carouselRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* Popup thông báo thêm vào giỏ hàng */}
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
          <div className="bg-[rgba(51,51,51,0.85)] flex flex-col items-center justify-center w-[380px] min-h-[210px] py-5 rounded-md shadow-xl pointer-events-auto animate-fade-in">
            <div className="bg-[#00bfa5] rounded-full w-14 h-14 flex items-center justify-center mb-4">
              <svg className="text-white w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="text-white text-base text-center px-4 leading-snug block w-full">
              Khóa học đã được thêm vào Giỏ hàng
            </span>
            <button
              onClick={() => { setShowPopup(false); router.push('/checkout'); }}
              className="mt-3 text-[#ff4d4f] hover:text-[#ff7875] text-[15px] font-semibold transition-colors cursor-pointer outline-none border-none bg-transparent block mx-auto underline"
              style={{ pointerEvents: 'auto' }}
            >
              Thanh toán ngay
            </button>
          </div>
        </div>
      )}
      {/* End popup */}
      <section className="bg-background overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pt-4 md:pt-12"
          >
            <h1 className="text-4xl md:text-6xl font-semibold text-primary tracking-tight mb-12">
              {t("program_page.title")}
            </h1>
            <div className="relative w-full flex items-center">
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 md:flex-wrap md:gap-1 md:bg-gray-100 md:rounded-full md:p-1 items-center scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`relative rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-colors duration-300 whitespace-nowrap md:flex-shrink-0 ${filter === f.id
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:text-black"
                      }`}
                  >
                    {filter === f.id && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-black rounded-full z-20"
                        style={{ borderRadius: 9999 }}
                        transition={{ duration: 0.6, type: "spring", bounce: 0.2 }}
                      />
                    )}
                    <span className="relative z-30">{t(`program_page.filters.${f.id}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4"
        >
          <div
            ref={carouselRef}
            onScroll={updateScrollButtons}
            className="w-full overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] py-10"
          >
            <div className="flex gap-4 md:gap-6 pl-4 xl:pl-[calc((100vw-1280px)/2+1rem)] pr-4 md:pr-6">
              {isLoading
                ? Array(4).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)
                : filteredCourses.map((course) => {
                  const actionState = getCourseActionState(course.slug);

                  return (
                    <motion.div
                      key={course.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      data-course-card="true"
                      className="w-[270px] md:w-[420px] flex-shrink-0 snap-center flex flex-col justify-between"
                    >
                      <Link
                        href={`/program-${course.mode}/${course.slug}`}
                        className="group block w-full relative aspect-video overflow-hidden transition-transform duration-300 ease-in-out hover:scale-[1.02]"
                      >
                        <img
                          alt={t(course.title)}
                          src={course.heroImage}
                          className={`w-full h-full object-cover rounded-[30px] ${course.slug === 'thu-thach-30-ngay' ? 'object-top' : ''}`}
                        />
                      </Link>
                      <div className="flex flex-col items-center text-center w-full max-w-full pb-10 flex-grow">
                        <div className="flex gap-2 mt-4 h-5 items-center">
                          <p className="text-orange-600 font-medium text-xs m-0 text-center w-full">
                            {t(course.info.topic)}
                          </p>
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-0 leading-tight flex flex-col justify-center h-16">
                          <span className="block">{t(course.title)}</span>
                        </h3>
                        <div className="text-gray-500 text-sm max-w-[90%] mx-auto mb-4 min-h-[40px]">
                          <span className="block">{t(course.mission).substring(0, 80)}...</span>
                        </div>
                        <p className="text-base font-medium mb-4">
                          {course.price.currency === 'VNĐ'
                            ? `${parseInt(course.price.amount.replace(/[.,]/g, '')).toLocaleString('vi-VN')}\u00A0₫`
                            : `${course.price.currency} ${course.price.amount}`
                          }
                        </p>
                        <div className="flex flex-col items-center justify-center gap-3 mt-auto w-full px-2">
                          <div className="flex items-center justify-center gap-2 w-full">
                            <button
                              onClick={() => handleAddToCart(course)}
                              title={actionState.label}
                              aria-disabled={actionState.isDisabled}
                              disabled={actionState.isDisabled}
                              className="h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#ffeeee] text-[#d0011b] border border-[#d0011b] transition-all hover:bg-[#ffdada] active:scale-95 px-3 w-fit disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100 disabled:active:scale-100"
                            >
                              <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                              <span className="font-bold text-xs sm:text-sm whitespace-nowrap">
                                {actionState.label}
                              </span>
                            </button>
                            <button
                              onClick={() => {
                                buyNow(course);
                                router.push("/checkout");
                              }}
                              aria-disabled={actionState.isDisabled}
                              disabled={actionState.isDisabled}
                              className="inline-flex items-center justify-center h-10 rounded-lg bg-[#d0011b] text-white transition-all hover:bg-[#b00118] active:scale-95 shadow-md font-bold text-sm px-3 w-fit disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300 disabled:active:scale-100"
                            >
                              {actionState.secondaryLabel}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
            </div>
          </div>
          <div className="container max-w-7xl mx-auto px-4 mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="rounded-full w-10 h-10 bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5 text-gray-800" />
              <span className="sr-only">{t("program_page.card.previous")}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="rounded-full w-10 h-10 bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5 text-gray-800" />
              <span className="sr-only">{t("program_page.card.next")}</span>
            </Button>
          </div>
        </motion.div>
      </section>


    </>
  );
}
