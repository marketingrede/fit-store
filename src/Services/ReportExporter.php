<?php

declare(strict_types=1);

namespace App\Services;

use Psr\Http\Message\ResponseInterface;
use ZipArchive;

final class ReportExporter
{
    /**
     * @param list<string> $headers
     * @param list<array<string, mixed>> $rows
     */
    public function toResponse(
        ResponseInterface $response,
        string $format,
        string $basename,
        array $headers,
        array $rows,
    ): ResponseInterface {
        $format = strtolower($format);

        return match ($format) {
            'json' => $this->jsonResponse($response, $basename, $headers, $rows),
            'ods' => $this->odsResponse($response, $basename, $headers, $rows),
            default => $this->csvResponse($response, $basename, $headers, $rows),
        };
    }

    /**
     * @param list<string> $headers
     * @param list<array<string, mixed>> $rows
     */
    private function csvResponse(
        ResponseInterface $response,
        string $basename,
        array $headers,
        array $rows,
    ): ResponseInterface {
        $stream = fopen('php://temp', 'r+');
        if ($stream === false) {
            throw new \RuntimeException('Não foi possível gerar o arquivo CSV.');
        }

        fprintf($stream, "\xEF\xBB\xBF");
        fputcsv($stream, $headers, ';');

        foreach ($rows as $row) {
            $line = [];
            foreach ($headers as $header) {
                $line[] = $row[$header] ?? '';
            }
            fputcsv($stream, $line, ';');
        }

        rewind($stream);
        $content = stream_get_contents($stream) ?: '';
        fclose($stream);

        $response->getBody()->write($content);

        return $response
            ->withHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->withHeader('Content-Disposition', 'attachment; filename="' . $basename . '.csv"');
    }

    /**
     * @param list<string> $headers
     * @param list<array<string, mixed>> $rows
     */
    private function jsonResponse(
        ResponseInterface $response,
        string $basename,
        array $headers,
        array $rows,
    ): ResponseInterface {
        $payload = [
            'exported_at' => gmdate('c'),
            'columns' => $headers,
            'row_count' => count($rows),
            'rows' => $rows,
        ];

        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        return $response
            ->withHeader('Content-Type', 'application/json; charset=UTF-8')
            ->withHeader('Content-Disposition', 'attachment; filename="' . $basename . '.json"');
    }

    /**
     * @param list<string> $headers
     * @param list<array<string, mixed>> $rows
     */
    private function odsResponse(
        ResponseInterface $response,
        string $basename,
        array $headers,
        array $rows,
    ): ResponseInterface {
        if (!class_exists(ZipArchive::class)) {
            throw new \RuntimeException('Extensão ZIP necessária para exportar ODS.');
        }

        $tmp = tempnam(sys_get_temp_dir(), 'ods_');
        if ($tmp === false) {
            throw new \RuntimeException('Não foi possível criar arquivo temporário.');
        }

        $zipPath = $tmp . '.ods';
        @unlink($tmp);

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Não foi possível gerar o arquivo ODS.');
        }

        $zip->addFromString('mimetype', 'application/vnd.oasis.opendocument.spreadsheet');
        $zip->setCompressionName('mimetype', ZipArchive::CM_STORE);
        $zip->addFromString('META-INF/manifest.xml', $this->odsManifest());
        $zip->addFromString('content.xml', $this->odsContent($headers, $rows));
        $zip->close();

        $content = file_get_contents($zipPath) ?: '';
        @unlink($zipPath);

        $response->getBody()->write($content);

        return $response
            ->withHeader('Content-Type', 'application/vnd.oasis.opendocument.spreadsheet')
            ->withHeader('Content-Disposition', 'attachment; filename="' . $basename . '.ods"');
    }

    private function odsManifest(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:media-type="application/vnd.oasis.opendocument.spreadsheet" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="content.xml"/>
</manifest:manifest>
XML;
    }

    /**
     * @param list<string> $headers
     * @param list<array<string, mixed>> $rows
     */
    private function odsContent(array $headers, array $rows): string
    {
        $escape = static fn (string $value): string => htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'
            . '<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"'
            . ' xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"'
            . ' xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0">'
            . '<office:body><office:spreadsheet><table:table table:name="Relatorio">';

        $xml .= '<table:table-row>';
        foreach ($headers as $header) {
            $xml .= '<table:table-cell office:value-type="string"><text:p>'
                . $escape((string) $header)
                . '</text:p></table:table-cell>';
        }
        $xml .= '</table:table-row>';

        foreach ($rows as $row) {
            $xml .= '<table:table-row>';
            foreach ($headers as $header) {
                $value = (string) ($row[$header] ?? '');
                $xml .= '<table:table-cell office:value-type="string"><text:p>'
                    . $escape($value)
                    . '</text:p></table:table-cell>';
            }
            $xml .= '</table:table-row>';
        }

        $xml .= '</table:table></office:spreadsheet></office:body></office:document-content>';

        return $xml;
    }
}
