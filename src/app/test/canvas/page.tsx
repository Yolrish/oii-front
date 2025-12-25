'use client'
import { useState } from "react";
import {
    CanvasExample as CanvasExampleComponent,
    UploadCanvasExample as UploadCanvasExampleComponent,
} from "@/components/common/canvas";
export default function CanvasTestPage() {

    enum CanvasExample {
        NORMAL = 'normal',
        UPLOAD = 'upload',
    }

    const [mode, setMode] = useState<CanvasExample>(CanvasExample.NORMAL);

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex flex-row gap-2 justify-start items-center p-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md"
                    onClick={() => setMode(CanvasExample.NORMAL)}
                >Normal</button>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-md"
                    onClick={() => setMode(CanvasExample.UPLOAD)}
                >Upload</button>
            </div>
            <div className="flex-1 w-full">
                {mode === CanvasExample.NORMAL && <CanvasExampleComponent />}
                {mode === CanvasExample.UPLOAD && <UploadCanvasExampleComponent />}
            </div>
        </div>
    );
}