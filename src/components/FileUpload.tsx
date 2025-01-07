'use client';

import { formatFileSize } from '@edgestore/react/utils';
import { UploadCloudIcon, X } from 'lucide-react';
import * as React from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';
import { Button } from './ui/button';

const variants = {
  base: 'relative rounded-md flex justify-center items-center flex-col cursor-pointer min-h-[150px] min-w-[200px] border border-dashed border-gray-400 dark:border-gray-300 transition-colors duration-200 ease-in-out',
  active: 'border-2',
  disabled: 'bg-gray-200 border-gray-300 cursor-default pointer-events-none bg-opacity-30 dark:bg-gray-700',
  accept: 'border border-blue-500 bg-blue-500 bg-opacity-10',
  reject: 'border border-red-700 bg-red-700 bg-opacity-10',
};

type InputProps = {
  width: number;
  height: number;
  className?: string;
  value?: File | string;
  onChange?: (file?: File) => void | Promise<void>;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, 'disabled'>;
};

const ERROR_MESSAGES = {
  fileTooLarge(maxSize: number) {
    return `The file is too large. Max size is ${formatFileSize(maxSize)}.`;
  },
  tooManyFiles(maxFiles: number) {
    return `You can only add ${maxFiles} file(s).`;
  },
};

const SingleFileDropzone = React.forwardRef<HTMLInputElement, InputProps>(
  ({ dropzoneOptions, width, height, value, className, disabled, onChange }, ref) => {
    const {
      getRootProps,
      getInputProps,
      acceptedFiles,
      fileRejections,
      isFocused,
      isDragAccept,
      isDragReject,
    } = useDropzone({
      accept: { 'pdf/*': [] }, // Accept all files
      multiple: false,
      disabled,
      onDrop: (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
          void onChange?.(file);
        }
      },
      ...dropzoneOptions,
    });

    // Styling
    const dropZoneClassName = React.useMemo(
      () =>
        twMerge(
          variants.base,
          isFocused && variants.active,
          disabled && variants.disabled,
          (isDragReject ?? fileRejections[0]) && variants.reject,
          isDragAccept && variants.accept,
          className,
        ).trim(),
      [isFocused, fileRejections, isDragAccept, isDragReject, disabled, className],
    );

    // Error messages
    const errorMessage = fileRejections[0]?.errors[0]?.message;

    return (
      <div>
        <div
          {...getRootProps({
            className: dropZoneClassName,
            style: { width, height },
          })}
        >
          {/* Main File Input */}
          <input ref={ref} {...getInputProps()} />

          <div className="flex flex-col items-center justify-center text-xs text-gray-400">
            <UploadCloudIcon className="mb-2 h-7 w-7" />
            {acceptedFiles[0] ? (
              <div>
                <p className="text-gray-600 dark:text-gray-200">
                  {acceptedFiles[0].name} ({formatFileSize(acceptedFiles[0].size)})
                </p>
              </div>
            ) : (
              <div>
                <div className="text-gray-400">drag & drop to upload</div>
                <div className="mt-3">
                  <Button type="button" disabled={disabled}>
                    select
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Remove File Icon */}
          {acceptedFiles[0] && !disabled && (
            <div
              className="group absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 transform"
              onClick={(e) => {
                e.stopPropagation();
                void onChange?.(undefined);
              }}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md border border-solid border-gray-500 bg-white transition-all duration-300 hover:h-6 hover:w-6 dark:border-gray-400 dark:bg-black">
                <X className="text-gray-500 dark:text-gray-400" width={16} height={16} />
              </div>
            </div>
          )}
        </div>

        {/* Error Text */}
        {errorMessage && <div className="mt-1 text-xs text-red-500">{errorMessage}</div>}
      </div>
    );
  },
);
SingleFileDropzone.displayName = 'SingleFileDropzone';

export { SingleFileDropzone };
