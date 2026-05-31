"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Calendar, ArrowRight, Lock } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import { courses } from "@/data/courses";
import { getCourseDetailBySlug } from "@/lib/services/courseService";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface CourseSlide {
  id: number;
  slug: string;
  href: string;
  image: string;
  imageMobile?: string;
  date: string;
  title: string;
  label: string;
  content: string;
  type: string;
}

const SlideContent = ({ slide }: { slide: CourseSlide }) => {
  const { t } = useLanguage();
  const { buyNow } = useCart();
  const router = useRouter();
  const isThirtyDayChallenge = slide.slug === "thu-thach-30-ngay";
  const thirtyDayCourseData = courses.find((c) => c.slug === "thu-thach-30-ngay");
  const isRegistrationClosed = isThirtyDayChallenge && thirtyDayCourseData?.registrationOpen === false;

  const handleRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isThirtyDayChallenge) {
      router.push(slide.href);
      return;
    }

    const courseData = courses.find((c) => c.slug === slide.slug);
    if (courseData) {
      buyNow(courseData);
      router.push("/checkout");
    }
  };

  // Button labels: both desktop and mobile are 'Đăng ký ngay'
  const mobileButtonLabel = t("courses.buttons.register_now");
  const desktopButtonLabel = t("courses.buttons.register_now");

  // Custom desktop button handler for 30-day challenge
  const handleDesktopRegister = (e: React.MouseEvent, slide: CourseSlide) => {
    e.preventDefault();
    e.stopPropagation();
    if (slide.slug === "thu-thach-30-ngay") {
      // Go to checkout directly
      const courseData = courses.find((c) => c.slug === slide.slug);
      if (courseData) {
        buyNow(courseData);
        router.push("/checkout");
      }
    } else {
      handleRegister(e);
    }
  };

  return (
    <Link href={slide.href} className="relative block h-full w-full overflow-hidden brightness-100">
      <Image
        src={slide.image}
        alt={slide.title}
        fill
        className="hidden h-full w-full object-contain bg-white md:block"
      />
      <Image
        src={slide.imageMobile || slide.image}
        alt={slide.title}
        fill
        className="h-full w-full object-contain bg-white md:hidden"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      <div className="absolute inset-0 flex flex-col items-center justify-end p-6 pb-12 text-center text-white md:hidden">
        <div className="w-full max-w-sm space-y-4">
          <h3 className="text-2xl font-black leading-[1.2] tracking-tight text-white drop-shadow-lg">{slide.type}</h3>
          <p className="line-clamp-2 px-4 text-sm font-medium text-white/90 drop-shadow-md">
            {slide.content}
          </p>
          {isRegistrationClosed ? (
            <div className="flex items-center justify-center gap-2 rounded-full bg-white/20 px-10 py-3 text-sm font-bold text-white/70 backdrop-blur-sm">
              <Lock className="h-4 w-4 flex-shrink-0" />
              Đã đóng đăng ký
            </div>
          ) : (
            <Button
              className="rounded-full !bg-[#d0011b] px-10 py-6 text-base font-black leading-[1.35] !text-white shadow-2xl transition-all duration-300 hover:!bg-[#d0011b]/90 active:scale-95"
              onClick={handleRegister}
            >
              {mobileButtonLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 hidden flex-col justify-end px-8 py-6 text-white md:flex">
        <div className="info-bottom slide-bottom flex items-center gap-4">
          {isRegistrationClosed ? (
            <div className="flex h-auto shrink-0 items-center justify-center gap-1.5 rounded-full bg-white/20 px-6 py-2.5 text-sm font-bold text-white/70 backdrop-blur-sm">
              <Lock className="h-3.5 w-3.5 flex-shrink-0" />
              Đã đóng đăng ký
            </div>
          ) : (
            <Button
              className="h-auto shrink-0 rounded-full !bg-[#d0011b] px-6 py-2.5 text-sm font-bold leading-[1.35] !text-white shadow-lg hover:!bg-[#d0011b]/90"
              onClick={(e) => handleDesktopRegister(e, slide)}
            >
              {desktopButtonLabel}
            </Button>
          )}
          <p className="mb-0 flex h-full translate-y-[2px] items-center truncate text-lg font-medium drop-shadow-md">
            <span className="font-bold text-white">{slide.type}</span>
            <span className="mx-2 text-white/50">•</span>
            <span className="text-white/80">{slide.content}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

const Courses: React.FC = () => {
  const { t } = useLanguage();
  const swiperRef = React.useRef<SwiperType | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [thirtyDayPreview, setThirtyDayPreview] = React.useState<{ desktop?: string; mobile?: string }>({});

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    async function fetchThirtyDayPreview() {
      try {
        const dynamicData = await getCourseDetailBySlug("thu-thach-30-ngay");
        if (dynamicData?.program) {
          setThirtyDayPreview({
            desktop: dynamicData.program.image || undefined,
            mobile: dynamicData.program.banner || dynamicData.program.image || undefined,
          });
        }
      } catch (error) {
        console.error("Error fetching 30-day preview:", error);
      }
    }

    fetchThirtyDayPreview();
  }, []);

  const thirtyDayCourse = React.useMemo(() => courses.find((c) => c.slug === "thu-thach-30-ngay"), []);

  const slides: CourseSlide[] = React.useMemo(
    () => [
      {
        id: 2,
        slug: "la-chinh-minh",
        href: "/program-offline/la-chinh-minh",
        image: "/images/programs/la-chinh-minh-desktop.svg",
        imageMobile: "/images/programs/la-chinh-minh-mobile.svg",
        date: "5/3-8/3/2026",
        title: t("courses.slides.lcm.title"),
        label: t("courses.upcoming"),
        content: t("courses.slides.lcm.content"),
        type: "Offline",
      },
      {
        id: 5,
        slug: "cuoc-song-cua-ban",
        href: "/program-online/cuoc-song-cua-ban",
        image: "/images/programs/cuoc-song-cua-ban.png",
        imageMobile: "/images/programs/cuoc-song-cua-ban-mobile.svg",
        date: "01/11/2025",
        title: t("courses.slides.cscb.title"),
        label: t("courses.online"),
        content: t("courses.slides.cscb.content"),
        type: "Online",
      },
      {
        id: 8,
        slug: "thu-thach-30-ngay",
        href: "/program-online/thu-thach-30-ngay",
        image: thirtyDayPreview.desktop || thirtyDayCourse?.heroImage || "/course/30days_desktop.png",
        imageMobile: thirtyDayPreview.mobile || thirtyDayCourse?.mobileImage || "/course/30days_mobile.png",
        date: "28/12/2025 - 28/01/2026",
        title: t("courses.slides.tt30n.title"),
        label: t("courses.online"),
        content: t("courses.slides.tt30n.content"),
        type: "Membership",
      },
      {
        id: 9,
        slug: "thuong-hieu-cua-ban",
        href: "/program-online/thuong-hieu-cua-ban",
        image: "/images/programs/thuong-hieu-cua-ban.png",
        imageMobile: "/images/programs/thuong-hieu-cua-ban-mobile.svg",
        date: "15/04/2026",
        title: t("courses.slides.thcb.title"),
        label: t("courses.online"),
        content: t("courses.slides.thcb.content"),
        type: "Online",
      },
    ],
    [t, thirtyDayCourse, thirtyDayPreview.desktop, thirtyDayPreview.mobile],
  );

  const coursesHeading = t("courses.heading");
  const headingParts = coursesHeading.split('\n');
  const coursesHeadingLine1 = headingParts[0];
  const coursesHeadingLine2 = headingParts[1] || "";

  if (!isMounted) return null;

  return (
    <section id="courses-section" className="relative overflow-x-hidden bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto text-center">
          <h2 className="relative z-10 mb-8 pt-[0.08em] text-center text-2xl font-black uppercase tracking-tight leading-[1.15] text-amber-400 sm:mb-10 sm:text-3xl md:mb-12 md:text-4xl lg:text-5xl xl:text-[68px]">
            <span className="block">{coursesHeadingLine1}</span>
            {coursesHeadingLine2 && <span className="block">{coursesHeadingLine2}</span>}
          </h2>
        </div>

        <div className="relative group/carousel">
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            centeredSlides
            loop
            speed={600}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
              stopOnLastSlide: false,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            modules={[Autoplay, Pagination]}
            className="!overflow-visible"
            breakpoints={{
              320: {
                slidesPerView: 1.15,
                spaceBetween: 12,
              },
              640: {
                slidesPerView: 1.2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 1.1,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 1.2,
                spaceBetween: 32,
              },
            }}
          >
            {[...slides, ...slides, ...slides].map((slide, index) => (
              <SwiperSlide
                key={`${slide.id}-${index}`}
                className={cn("aspect-[9/16] overflow-hidden bg-white md:aspect-video", "cursor-pointer hover:scale-100 active:scale-100")}
              >
                <SlideContent slide={slide} />
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            onClick={() => {
              swiperRef.current?.slidePrev();
              swiperRef.current?.autoplay.start();
            }}
            className="swiper-btn-prev absolute left-1 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-[#F7B50C] transition-all duration-300 hover:scale-110 active:scale-95 md:left-4 md:h-16 md:w-16"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 -960 960 960" width="40" fill="currentColor" className="rotate-180 scale-75 md:scale-100">
              <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
            </svg>
          </button>
          <button
            onClick={() => {
              swiperRef.current?.slideNext();
              swiperRef.current?.autoplay.start();
            }}
            className="swiper-btn-next absolute right-1 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-[#F7B50C] transition-all duration-300 hover:scale-110 active:scale-95 md:right-4 md:h-16 md:w-16"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 -960 960 960" width="40" fill="currentColor" className="scale-75 md:scale-100">
              <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .swiper-pagination {
          bottom: -40px !important;
        }
        .swiper-pagination-bullet {
          background: #aaa !important;
          opacity: 1 !important;
          width: 8px;
          height: 8px;
          transition: all 0.3s;
        }
        .swiper-pagination-bullet-active {
          background: #fdb913 !important;
          width: 24px;
          border-radius: 4px;
        }
        .swiper-slide {
          transform: scale(1) !important;
        }
        .swiper-slide:hover,
        .swiper-slide:active {
          transform: none !important;
          filter: none !important;
          brightness: 1 !important;
          scale: 1 !important;
          translate: 0 !important;
        }
        .swiper-slide:hover img,
        .swiper-slide:active img {
          filter: none !important;
          brightness: 1 !important;
        }
        a.swiper-slide:hover {
          filter: none !important;
          brightness: 1 !important;
          transform: none !important;
          translate: 0 !important;
          translatey: 0 !important;
        }
        .swiper-slide img:hover {
          filter: none !important;
          brightness: 1 !important;
          opacity: 1 !important;
          transform: scale(1) !important;
          translate: 0 !important;
        }
        .swiper-slide img {
          transform: scale(1) !important;
          translate: 0 !important;
        }
      `}</style>
    </section>
  );
};

export default Courses;
