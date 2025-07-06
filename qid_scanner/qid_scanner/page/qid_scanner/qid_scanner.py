import frappe
import cv2
import numpy as np
import pytesseract
from PIL import Image
import base64
import io
import re
import hashlib
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@frappe.whitelist()
def process_qid_image(image_data, metadata=None):
    """
    Process QID image and extract information
    """
    try:
        # Initialize processors
        processor = QIDImageProcessor()
        validator = QIDValidator()
        
        # Process the image
        result = processor.process_qid_image(image_data, metadata)
        
        # Return success response
        frappe.response['message'] = result
        return result
        
    except Exception as e:
        logger.error(f"QID processing failed: {str(e)}")
        frappe.throw(f"QID processing failed: {str(e)}")

@frappe.whitelist()
def validate_qid_number(qid_number):
    """
    Validate QID number format and extract information
    """
    try:
        validator = QIDValidator()
        result = validator.validate_qid_number(qid_number)
        
        frappe.response['message'] = result
        return result
        
    except Exception as e:
        logger.error(f"QID validation failed: {str(e)}")
        frappe.throw(f"QID validation failed: {str(e)}")

@frappe.whitelist()
def get_api_info():
    """
    Get API information and capabilities
    """
    return {
        'service': 'ERPNext QID Scanner',
        'version': '1.0',
        'description': 'Qatar ID document processing and validation service for ERPNext',
        'capabilities': [
            'QID image processing',
            'Text extraction using OCR',
            'QID number validation',
            'Personal information extraction',
            'Date parsing and validation'
        ],
        'supported_formats': [
            'JPEG',
            'PNG',
            'Base64 encoded images'
        ],
        'timestamp': datetime.now().isoformat()
    }

class QIDImageProcessor:
    """QID Image Processing Engine for ERPNext"""
    
    def __init__(self):
        # OCR configuration
        self.tesseract_config = {
            'default': '--oem 3 --psm 6',
            'numbers': '--oem 3 --psm 8 -c tessedit_char_whitelist=0123456789',
            'text': '--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz '
        }
        
        self.validator = QIDValidator()
        logger.info("QID Image Processor initialized for ERPNext")
    
    def process_qid_image(self, image_data, metadata=None):
        """Process QID image and extract information"""
        start_time = datetime.now()
        processing_id = hashlib.md5(f"{image_data[:100]}{start_time}".encode()).hexdigest()[:8]
        
        logger.info(f"Starting QID processing [{processing_id}] in ERPNext")
        
        try:
            # Step 1: Decode and process image
            logger.info(f"[{processing_id}] Processing image...")
            processed_image = self._process_image(image_data)
            
            # Step 2: Extract text using Tesseract
            logger.info(f"[{processing_id}] Extracting text...")
            ocr_results = self._extract_text_multiple_methods(processed_image)
            
            # Combine results
            combined_text = '\n'.join([text for text in ocr_results.values() if text])
            
            if not combined_text.strip():
                return {
                    'success': False,
                    'error': {
                        'code': 'NO_TEXT_EXTRACTED',
                        'message': 'No text could be extracted from the image',
                        'details': 'OCR failed to detect any readable text'
                    },
                    'processing_id': processing_id,
                    'timestamp': datetime.now().isoformat()
                }
            
            # Step 3: Extract QID information
            logger.info(f"[{processing_id}] Extracting QID information...")
            qid_info = self._extract_qid_information(combined_text, ocr_results)
            
            # Step 4: Validate extracted data
            logger.info(f"[{processing_id}] Validating extracted data...")
            validation_results = self.validator.validate_extracted_data(qid_info['data'])
            
            # Step 5: Compile results
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                'success': qid_info['success'],
                'data': qid_info['data'],
                'validation': validation_results,
                'processing_metadata': {
                    'processing_id': processing_id,
                    'processing_time': processing_time,
                    'timestamp': datetime.now().isoformat(),
                    'ocr_engines_used': ['tesseract'],
                    'image_processed': True,
                    'erpnext_integration': True
                }
            }
            
            if not validation_results['valid']:
                result['success'] = False
                result['error'] = {
                    'code': 'VALIDATION_FAILED',
                    'message': 'Extracted data failed validation',
                    'details': validation_results['errors']
                }
            
            logger.info(f"[{processing_id}] Processing completed in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"[{processing_id}] Processing failed: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'PROCESSING_FAILED',
                    'message': str(e),
                    'details': 'Unexpected error during processing'
                },
                'processing_id': processing_id,
                'timestamp': datetime.now().isoformat()
            }
    
    def _process_image(self, image_data):
        """Process and enhance image for OCR"""
        try:
            # Remove data URL prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Validate image size
            height, width = opencv_image.shape[:2]
            if width < 200 or height < 100:
                raise ValueError(f"Image too small: {width}x{height}. Minimum size: 200x100")
            
            # Resize if too large
            max_width = 1200
            if width > max_width:
                scale = max_width / width
                new_width = int(width * scale)
                new_height = int(height * scale)
                opencv_image = cv2.resize(opencv_image, (new_width, new_height))
            
            # Image enhancement pipeline
            enhanced_image = self._enhance_image(opencv_image)
            
            return enhanced_image
            
        except Exception as e:
            raise ValueError(f"Image processing failed: {e}")
    
    def _enhance_image(self, image):
        """Enhance image quality for better OCR"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Morphological operations to clean up
        kernel = np.ones((2, 2), np.uint8)
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Convert back to BGR for consistency
        enhanced = cv2.cvtColor(cleaned, cv2.COLOR_GRAY2BGR)
        
        return enhanced
    
    def _extract_text_multiple_methods(self, image):
        """Extract text using multiple OCR configurations"""
        results = {}
        
        # Method 1: Default configuration
        results['tesseract_default'] = self._extract_text_tesseract(image, 'default')
        
        # Method 2: Numbers only
        results['tesseract_numbers'] = self._extract_text_tesseract(image, 'numbers')
        
        # Method 3: Text only
        results['tesseract_text'] = self._extract_text_tesseract(image, 'text')
        
        return results
    
    def _extract_text_tesseract(self, image, config_type='default'):
        """Extract text using Tesseract OCR"""
        try:
            config = self.tesseract_config.get(config_type, self.tesseract_config['default'])
            
            # Convert to PIL Image
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
            
            # Extract text
            text = pytesseract.image_to_string(pil_image, config=config, lang='eng+ara')
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            return ""
    
    def _extract_qid_information(self, combined_text, ocr_results):
        """Extract QID information from OCR text"""
        try:
            # Extract QID numbers
            qid_numbers = self.validator.extract_qid_numbers(combined_text)
            
            if not qid_numbers:
                return {
                    'success': False,
                    'data': {},
                    'error': 'No valid QID number found'
                }
            
            # Use the first valid QID
            qid_number = qid_numbers[0]
            qid_validation = self.validator.validate_qid_number(qid_number)
            
            if not qid_validation['valid']:
                return {
                    'success': False,
                    'data': {},
                    'error': f"Invalid QID: {qid_validation['error']}"
                }
            
            # Extract other information
            names = self.validator.extract_names(combined_text)
            dates = self.validator.extract_dates(combined_text)
            
            # Determine birth date and expiry date
            birth_date = None
            expiry_date = None
            
            if dates:
                sorted_dates = sorted(dates)
                qid_birth_year = qid_validation['parsed_info']['birth_year']
                
                for date_str in sorted_dates:
                    date_year = int(date_str.split('-')[0])
                    if abs(date_year - qid_birth_year) <= 1:
                        birth_date = date_str
                        break
                
                if len(sorted_dates) > 1:
                    expiry_date = sorted_dates[-1]
                elif len(sorted_dates) == 1 and not birth_date:
                    expiry_date = sorted_dates[0]
            
            # Calculate confidence scores
            confidence_scores = self._calculate_confidence_scores(
                combined_text, qid_validation, names, dates, ocr_results
            )
            
            return {
                'success': True,
                'data': {
                    'qid_number': qid_number,
                    'full_name': names,
                    'date_of_birth': birth_date,
                    'nationality': qid_validation['parsed_info']['nationality'],
                    'expiry_date': expiry_date,
                    'document_type': 'Qatar ID',
                    'confidence_scores': confidence_scores,
                    'qid_details': qid_validation['parsed_info']
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'data': {},
                'error': f"Information extraction failed: {e}"
            }
    
    def _calculate_confidence_scores(self, text, qid_validation, names, dates, ocr_results):
        """Calculate confidence scores for extracted data"""
        scores = {}
        
        # QID number confidence
        scores['qid_number'] = 0.98 if qid_validation['valid'] else 0.0
        
        # Name confidence
        if names.get('english'):
            word_count = len(names['english'].split())
            scores['name_english'] = min(0.95, word_count * 0.25 + 0.5)
        else:
            scores['name_english'] = 0.0
        
        if names.get('arabic'):
            char_count = len(names['arabic'])
            scores['name_arabic'] = min(0.95, char_count * 0.03 + 0.4)
        else:
            scores['name_arabic'] = 0.0
        
        scores['name'] = max(scores['name_english'], scores['name_arabic'])
        
        # Date confidence
        scores['date_of_birth'] = 0.9 if len(dates) >= 1 else 0.0
        scores['expiry_date'] = 0.9 if len(dates) >= 2 else 0.5 if len(dates) == 1 else 0.0
        
        # Nationality confidence
        scores['nationality'] = 0.92 if qid_validation['valid'] else 0.0
        
        # OCR quality
        text_length = len(text.strip())
        ocr_engines_count = len([r for r in ocr_results.values() if r.strip()])
        scores['ocr_quality'] = min(0.95, (text_length / 100) * 0.3 + ocr_engines_count * 0.2)
        
        # Overall confidence
        individual_scores = [scores['qid_number'], scores['name'], scores['date_of_birth'], scores['nationality']]
        scores['overall'] = sum(individual_scores) / len(individual_scores)
        
        return scores

class QIDValidator:
    """QID Validation and Information Extraction"""
    
    def __init__(self):
        # Nationality codes mapping
        self.nationality_codes = {
            '250': 'French', '276': 'German', '826': 'British', '840': 'American',
            '356': 'Indian', '586': 'Pakistani', '050': 'Bangladeshi', '144': 'Sri Lankan',
            '524': 'Nepalese', '608': 'Filipino', '634': 'Qatari', '682': 'Saudi Arabian',
            '784': 'Emirati', '414': 'Kuwaiti', '048': 'Bahraini', '512': 'Omani',
            '400': 'Jordanian', '422': 'Lebanese', '760': 'Syrian', '818': 'Egyptian',
            '012': 'Algerian', '504': 'Moroccan', '788': 'Tunisian', '434': 'Libyan'
        }
    
    def validate_qid_number(self, qid_number):
        """Validate QID number format and extract information"""
        try:
            # Remove any spaces or special characters
            qid_clean = re.sub(r'[^\d]', '', str(qid_number))
            
            # Check length
            if len(qid_clean) != 11:
                return {
                    'valid': False,
                    'error': f'QID must be 11 digits, got {len(qid_clean)}',
                    'qid_number': qid_clean
                }
            
            # Extract components
            century_digit = qid_clean[0]
            year_digits = qid_clean[1:3]
            nationality_code = qid_clean[3:6]
            sequence_number = qid_clean[6:11]
            
            # Validate century digit
            if century_digit not in ['2', '3']:
                return {
                    'valid': False,
                    'error': f'Invalid century digit: {century_digit}. Must be 2 or 3',
                    'qid_number': qid_clean
                }
            
            # Calculate birth year
            year_int = int(year_digits)
            if century_digit == '2':
                birth_year = 1900 + year_int
            else:  # century_digit == '3'
                birth_year = 2000 + year_int
            
            # Validate birth year
            current_year = datetime.now().year
            if birth_year > current_year:
                return {
                    'valid': False,
                    'error': f'Invalid birth year: {birth_year}. Cannot be in the future',
                    'qid_number': qid_clean
                }
            
            if birth_year < 1900:
                return {
                    'valid': False,
                    'error': f'Invalid birth year: {birth_year}. Too old',
                    'qid_number': qid_clean
                }
            
            # Get nationality
            nationality = self.nationality_codes.get(nationality_code, f'Unknown ({nationality_code})')
            
            # Calculate age
            age = current_year - birth_year
            
            return {
                'valid': True,
                'qid_number': qid_clean,
                'components': {
                    'century_digit': century_digit,
                    'year_digits': year_digits,
                    'nationality_code': nationality_code,
                    'sequence_number': sequence_number
                },
                'parsed_info': {
                    'birth_year': birth_year,
                    'age': age,
                    'nationality': nationality,
                    'nationality_code': nationality_code
                }
            }
            
        except Exception as e:
            return {
                'valid': False,
                'error': f'QID validation failed: {e}',
                'qid_number': qid_number
            }
    
    def extract_qid_numbers(self, text):
        """Extract potential QID numbers from text"""
        # Pattern for 11-digit numbers starting with 2 or 3
        qid_pattern = r'\b[23]\d{10}\b'
        matches = re.findall(qid_pattern, text)
        
        # Validate each match
        valid_qids = []
        for match in matches:
            validation = self.validate_qid_number(match)
            if validation['valid']:
                valid_qids.append(match)
        
        return valid_qids
    
    def extract_names(self, text):
        """Extract names from OCR text"""
        names = {'english': '', 'arabic': ''}
        
        # Extract English names (2-4 words, alphabetic characters)
        english_pattern = r'\b[A-Z][a-z]+(?: [A-Z][a-z]+){1,3}\b'
        english_matches = re.findall(english_pattern, text)
        if english_matches:
            # Take the longest match as it's likely the full name
            names['english'] = max(english_matches, key=len)
        
        # Extract Arabic names
        arabic_pattern = r'[\u0600-\u06FF\s]+'
        arabic_matches = re.findall(arabic_pattern, text)
        if arabic_matches:
            # Clean and take the longest Arabic text
            arabic_texts = [match.strip() for match in arabic_matches if len(match.strip()) > 3]
            if arabic_texts:
                names['arabic'] = max(arabic_texts, key=len)
        
        return names
    
    def extract_dates(self, text):
        """Extract dates from text"""
        dates = []
        
        # Various date patterns
        date_patterns = [
            r'\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b',  # DD/MM/YYYY or DD-MM-YYYY
            r'\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b',  # YYYY/MM/DD or YYYY-MM-DD
            r'\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})\b',  # DD/MM/YY or DD-MM-YY
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    if len(match[2]) == 2:  # YY format
                        year = int(match[2])
                        year = 2000 + year if year < 50 else 1900 + year
                        date_str = f"{year:04d}-{int(match[1]):02d}-{int(match[0]):02d}"
                    elif len(match[0]) == 4:  # YYYY-MM-DD format
                        date_str = f"{int(match[0]):04d}-{int(match[1]):02d}-{int(match[2]):02d}"
                    else:  # DD/MM/YYYY format
                        date_str = f"{int(match[2]):04d}-{int(match[1]):02d}-{int(match[0]):02d}"
                    
                    # Validate date
                    year, month, day = map(int, date_str.split('-'))
                    if 1900 <= year <= 2050 and 1 <= month <= 12 and 1 <= day <= 31:
                        dates.append(date_str)
                except (ValueError, IndexError):
                    continue
        
        return list(set(dates))  # Remove duplicates
    
    def validate_extracted_data(self, data):
        """Validate all extracted data"""
        errors = []
        warnings = []
        confidence_scores = {}
        
        # Validate QID number
        if data.get('qid_number'):
            qid_validation = self.validate_qid_number(data['qid_number'])
            if not qid_validation['valid']:
                errors.append(f"Invalid QID number: {qid_validation['error']}")
                confidence_scores['qid_number'] = 0.0
            else:
                confidence_scores['qid_number'] = 0.98
                
                # Check birth year consistency
                if data.get('date_of_birth'):
                    extracted_year = int(data['date_of_birth'].split('-')[0])
                    qid_year = qid_validation['parsed_info']['birth_year']
                    if abs(extracted_year - qid_year) > 1:
                        warnings.append(f"Birth year mismatch: QID indicates {qid_year}, extracted date indicates {extracted_year}")
                        confidence_scores['date_consistency'] = 0.3
                    else:
                        confidence_scores['date_consistency'] = 0.95
        else:
            errors.append("No QID number found")
            confidence_scores['qid_number'] = 0.0
        
        # Validate names
        names = data.get('full_name', {})
        if names.get('english') or names.get('arabic'):
            if names.get('english'):
                confidence_scores['name_english'] = min(0.95, len(names['english'].split()) * 0.25 + 0.5)
            if names.get('arabic'):
                confidence_scores['name_arabic'] = min(0.95, len(names['arabic']) * 0.03 + 0.4)
            confidence_scores['name'] = max(
                confidence_scores.get('name_english', 0),
                confidence_scores.get('name_arabic', 0)
            )
        else:
            warnings.append("No name information extracted")
            confidence_scores['name'] = 0.0
        
        # Validate dates
        if data.get('date_of_birth'):
            try:
                birth_year = int(data['date_of_birth'].split('-')[0])
                current_year = datetime.now().year
                if birth_year > current_year or birth_year < 1900:
                    errors.append(f"Invalid birth year: {birth_year}")
                    confidence_scores['date_of_birth'] = 0.0
                else:
                    confidence_scores['date_of_birth'] = 0.9
            except (ValueError, IndexError):
                errors.append("Invalid date of birth format")
                confidence_scores['date_of_birth'] = 0.0
        else:
            warnings.append("No date of birth extracted")
            confidence_scores['date_of_birth'] = 0.0
        
        if data.get('expiry_date'):
            try:
                expiry_year = int(data['expiry_date'].split('-')[0])
                current_year = datetime.now().year
                if expiry_year < current_year:
                    warnings.append(f"QID appears to be expired: {data['expiry_date']}")
                confidence_scores['expiry_date'] = 0.9
            except (ValueError, IndexError):
                warnings.append("Invalid expiry date format")
                confidence_scores['expiry_date'] = 0.5
        else:
            warnings.append("No expiry date extracted")
            confidence_scores['expiry_date'] = 0.0
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'confidence_scores': confidence_scores
        }

