"use client";
import LeftSidebar from "@/components/LeftSidebar";
// import { CollaborativeApp } from "./CollaborativeApp";

import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSidebar from "@/components/RightSidebar";
import { defaultNavElement } from "@/constants";
import {
	handleCanvasMouseDown,
	handleCanvasMouseMove,
	handleCanvasMouseUp,
	handleCanvasObjectModified,
	handleResize,
	initializeFabric,
	renderCanvas,
} from "@/lib/canvas";
import { handleDelete } from "@/lib/key-events";
import { useMutation, useStorage } from "@/liveblocks.config";
import { ActiveElement } from "@/types/type";
import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";

export default function Page() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fabricRef = useRef<fabric.Canvas | null>(null);
	const isDrawing = useRef(false);
	const shapeRef = useRef<fabric.Object | null>(null);
	const selectedShapeRef = useRef<string | null>("rectangle");
	const activeObjectRef = useRef<fabric.Object | null>(null);

	const canvasObjects = useStorage((root) => root.canvasObjects);

	const syncShapeInStorage = useMutation(({ storage }, object) => {
		if (!object) return;

		const { objectId } = object;

		const shapedData = object.toJSON();
		shapedData.objectId = objectId;

		const canvasObjects = storage.get("canvasObjects");

		canvasObjects.set(objectId, shapedData);
	}, []);

	const deleteAllShapes = useMutation(({ storage }) => {
		const canvasObjects = storage.get("canvasObjects");

		if (!canvasObjects || canvasObjects.size === 0) return true;

		for (const [key, value] of canvasObjects.entries()) {
			canvasObjects.delete(key);
		}

		return canvasObjects.size === 0;
	}, []);

	const deleteShapeFromStorage = useMutation(({ storage }, objectId) => {
		const canvasObjects = storage.get("canvasObjects");

		canvasObjects.delete(objectId);
	}, []);

	const [activeElement, setActiveElement] = useState<ActiveElement>({
		name: "",
		value: "",
		icon: "",
	});

	const handleActiveElement = (elem: ActiveElement) => {
		setActiveElement(elem);

		switch (elem?.value) {
			case "reset":
				deleteAllShapes();
				fabricRef.current?.clear();
				setActiveElement(defaultNavElement);
				break;
			case "delete":
				handleDelete(fabricRef.current as any, deleteShapeFromStorage);
				setActiveElement(defaultNavElement);
				break;
			default:
				break;
		}

		selectedShapeRef.current = elem?.value as string;
	};

	useEffect(() => {
		const canvas = initializeFabric({ canvasRef, fabricRef });

		canvas.on("mouse:down", (options) => {
			handleCanvasMouseDown({
				options,
				canvas,
				selectedShapeRef,
				isDrawing,
				shapeRef,
			});
		});

		canvas.on("mouse:move", (options) => {
			handleCanvasMouseMove({
				options,
				canvas,
				selectedShapeRef,
				isDrawing,
				shapeRef,
				syncShapeInStorage,
			});
		});

		canvas.on("mouse:up", () => {
			handleCanvasMouseUp({
				canvas,
				isDrawing,
				shapeRef,
				activeObjectRef,
				selectedShapeRef,
				syncShapeInStorage,
				setActiveElement,
			});
		});

		canvas.on("object:modified", (options) => {
			handleCanvasObjectModified({
				options,
				syncShapeInStorage,
			});
		});

		window.addEventListener("resize", () => {
			handleResize({ canvas: fabricRef.current });
		});

		return () => {
			canvas.dispose();
		};
	}, []);

	useEffect(() => {
		renderCanvas({ fabricRef, canvasObjects, activeObjectRef });
	}, [canvasObjects]);

	return (
		<main className="h-screen overflow-hidden">
			<Navbar
				activeElement={activeElement}
				handleActiveElement={handleActiveElement}
			/>
			<section className="h-full flex flex-row">
				<LeftSidebar allShapes={Array.from(canvasObjects)} />
				<Live canvasRef={canvasRef} />
				<RightSidebar />
			</section>
		</main>
	);
}
