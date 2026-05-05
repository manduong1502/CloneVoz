'use client';

import { useState, useRef, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

export default function HtmlWithLightbox({ html, className = '' }) {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Parse images and add click listeners when html changes
  useEffect(() => {
    if (!containerRef.current) return;

    const imgElements = Array.from(containerRef.current.querySelectorAll('img'));
    
    // Create an array of images for the lightbox
    const imageList = imgElements.map(img => ({ src: img.src, alt: img.alt }));
    setImages(imageList);

    // Click handler using event delegation on the container
    const handleImageClick = (e) => {
      if (e.target.tagName === 'IMG') {
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

  return (
    <>
      <div 
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }} 
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
