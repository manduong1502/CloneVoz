'use client';

import { useState, useRef, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import twemoji from 'twemoji';
import 'yet-another-react-lightbox/styles.css';

export default function HtmlWithLightbox({ html, className = '' }) {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Parse images and add click listeners when html changes
  useEffect(() => {
    if (!containerRef.current) return;

    const imgElements = Array.from(containerRef.current.querySelectorAll('img:not(.twemoji)'));
    
    // Create an array of images for the lightbox
    const imageList = imgElements.map(img => ({ src: img.src, alt: img.alt }));
    setImages(imageList);

    // Click handler using event delegation on the container
    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG' && !e.target.classList.contains('twemoji')) {
        const clickedSrc = e.target.src;
        const index = imageList.findIndex(img => img.src === clickedSrc);
        if (index !== -1) {
          setCurrentIndex(index);
          setIsOpen(true);
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener('click', handleImageClick);

    // Make images look clickable
    imgElements.forEach(img => {
      img.style.cursor = 'zoom-in';
    });

    return () => {
      container.removeEventListener('click', handleImageClick);
    };
  }, [html]);

  const parsedHtml = twemoji.parse(html || '', {
    base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/',
    folder: '72x72',
    ext: '.png',
    className: 'twemoji inline-block w-5 h-5 align-middle mx-0.5'
  });

  return (
    <>
      <div 
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: parsedHtml }} 
      />
      
      {images.length > 0 && (
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          index={currentIndex}
          slides={images}
          plugins={[Zoom]}
          carousel={{ finite: images.length === 1 }}
          render={{
            buttonPrev: images.length <= 1 ? () => null : undefined,
            buttonNext: images.length <= 1 ? () => null : undefined,
          }}
          zoom={{
            maxZoomPixelRatio: 3,
            zoomInMultiplier: 2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            doubleClickMaxStops: 2,
            keyboardMoveDistance: 50,
            wheelZoomDistanceFactor: 100,
            pinchZoomDistanceFactor: 100,
            scrollToZoom: true,
          }}
        />
      )}
    </>
  );
}
