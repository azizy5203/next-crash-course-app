'use client';

import { useEffect, useRef, useState } from 'react';
import { useYDoc } from '../../../../hooks/useYDoc';

// Types for drawing strokes
interface Point {
  x: number;
  y: number;
}

interface Stroke {
  type: 'stroke';
  color: string;
  thickness: number;
  points: Point[];
  isInProgress?: boolean; // Added for real-time sync
}

export default function CanvasDraw() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const colorRef = useRef('#e4a5fa');
  const thicknessRef = useRef(1);
  const eraserRef = useRef(false);
  const lastUpdateRef = useRef(0); // For throttling real-time updates

  const [buttonBg, setButtonBg] = useState('bg-blue-500');
  
  // Initialize Yjs for collaborative drawing
  const { yMap } = useYDoc('canvas-room');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Function to resize canvas
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Set drawing style after resize
      ctx.strokeStyle = eraserRef.current ? '#ffffff' : colorRef.current;
      ctx.lineWidth = thicknessRef.current;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    // Initial canvas setup
    resizeCanvas();

    // Handle window resize
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    // Listen for collaborative drawing data
    const handleCollaborativeDrawing = () => {
      try {
        const drawingData = yMap?.get('drawing') as Stroke[] | undefined;
        if (drawingData && Array.isArray(drawingData)) {
          // Clear canvas and redraw from collaborative data
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          drawingData.forEach((stroke: Stroke) => {
            if (stroke.type === 'stroke') {
              ctx.strokeStyle = stroke.color;
              ctx.lineWidth = stroke.thickness;
              ctx.beginPath();
              
              stroke.points.forEach((point: Point, index: number) => {
                if (index === 0) {
                  ctx.moveTo(point.x, point.y);
                } else {
                  ctx.lineTo(point.x, point.y);
                }
              });
              ctx.stroke();
            }
          });
          
          // Restore current drawing style
          ctx.strokeStyle = eraserRef.current ? '#ffffff' : colorRef.current;
          ctx.lineWidth = thicknessRef.current;
        }
      } catch (error) {
        console.warn('Collaborative drawing error:', error);
      }
    };

    // Subscribe to collaborative changes only if yMap is available
    if (yMap) {
      yMap.observe(handleCollaborativeDrawing);
    }

    const getMousePos = (e: MouseEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    let currentStroke: Stroke | null = null;

    const startDrawing = (e: MouseEvent) => {
      isDrawingRef.current = true;
      const pos = getMousePos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      
      // Start new stroke for collaboration
      currentStroke = {
        type: 'stroke',
        color: eraserRef.current ? '#ffffff' : colorRef.current,
        thickness: thicknessRef.current,
        points: [pos]
      };

      // Immediately sync the start of the stroke
      if (yMap) {
        const currentDrawing = (yMap.get('drawing') as Stroke[]) || [];
        const newDrawing = [...currentDrawing];
        // Remove any existing in-progress stroke and add the new one
        const filteredDrawing = newDrawing.filter(stroke => !stroke.isInProgress);
        currentStroke.isInProgress = true;
        yMap.set('drawing', [...filteredDrawing, currentStroke]);
      }
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      const pos = getMousePos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      
      // Add point to current stroke if it exists
      if (currentStroke) {
        currentStroke.points.push(pos);
        
        // Real-time sync with throttling (update every 50ms max)
        const now = Date.now();
        if (yMap && now - lastUpdateRef.current > 50) {
          const currentDrawing = (yMap.get('drawing') as Stroke[]) || [];
          // Replace the in-progress stroke with updated version
          const filteredDrawing = currentDrawing.filter(stroke => !stroke.isInProgress);
          yMap.set('drawing', [...filteredDrawing, { ...currentStroke, isInProgress: true }]);
          lastUpdateRef.current = now;
        }
      }
    };

    const stopDrawing = () => {
      if (isDrawingRef.current && currentStroke) {
        // Finalize stroke: remove isInProgress flag
        const finalStroke = { ...currentStroke };
        delete finalStroke.isInProgress;
        
        // Save final stroke to collaborative map
        if (yMap) {
          const currentDrawing = (yMap.get('drawing') as Stroke[]) || [];
          const filteredDrawing = currentDrawing.filter(stroke => !stroke.isInProgress);
          yMap.set('drawing', [...filteredDrawing, finalStroke]);
        }
      }
      
      isDrawingRef.current = false;
      currentStroke = null;
      ctx.closePath();
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      if (yMap) {
        yMap.unobserve(handleCollaborativeDrawing);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [yMap]);

  const toggleEraser = () => {
    eraserRef.current = !eraserRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = eraserRef.current ? '#ffffff' : colorRef.current;
    ctx.lineWidth = thicknessRef.current;
    setButtonBg(eraserRef.current ? 'bg-red-500' : 'bg-blue-500');
  };

  const changeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    colorRef.current = e.target.value;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (!eraserRef.current) {
      ctx.strokeStyle = colorRef.current;
    }
  };

  const changeThickness = (e: React.ChangeEvent<HTMLInputElement>) => {
    thicknessRef.current = Number(e.target.value);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = thicknessRef.current;
  };

  const clearAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Clear collaborative drawing data
    yMap?.set('drawing', []);
  };

  return (
    <div className='flex flex-col items-center justify-start h-screen w-full gap-4 p-4'>
        <h1 className='text-2xl font-bold'>Canvas</h1>
        <div className='flex flex-row items-center justify-center gap-4'>
            <button className='bg-blue-400 hover:bg-blue-500 text-white p-2 rounded-md cursor-pointer' onClick={clearAll}>ClearAll</button>
            <button className={`${buttonBg} text-white p-2 rounded-md cursor-pointer`} onClick={toggleEraser}>Eraser</button>
            <input type="color" defaultValue={colorRef.current} onChange={changeColor} className='cursor-pointer' />
            <input type="range" min={1} max={10} defaultValue={thicknessRef.current} onChange={changeThickness} className='cursor-pointer' />
        </div>
        <div className='flex-1 w-full max-w-4xl'>
          <canvas
            className="w-full h-full"
            ref={canvasRef}
            style={{ border: '1px solid black', display: 'block', minHeight: '400px' }}
          />
        </div>
    </div>
  );
}
