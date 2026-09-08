<?php

namespace App\Console\Commands;

use App\Support\SystemChecks;
use Illuminate\Console\Command;

/**
 * The pre-release check. Run it after a deploy, or on the server whenever
 * something "should have sent an email".
 *
 * Exits non-zero on a failure so it can gate a deploy script rather than
 * only informing whoever happens to read the output.
 */
class Preflight extends Command
{
    protected $signature = 'sls:preflight';

    protected $description = 'Check that this deployment can send email and reach the site';

    public function handle(SystemChecks $checks): int
    {
        $rows = $checks->all();

        $this->newLine();
        $this->line('  SLS deployment check — '.app()->environment());
        $this->newLine();

        foreach ($rows as $check) {
            [$mark, $style] = match ($check['status']) {
                'ok' => ['PASS', 'info'],
                'warn' => ['WARN', 'comment'],
                default => ['FAIL', 'error'],
            };

            $this->line("  <{$style}>{$mark}</{$style}>  {$check['label']}");
            $this->line("        {$check['detail']}");

            if ($check['fix'] !== '') {
                $this->line("        <comment>→ {$check['fix']}</comment>");
            }

            $this->newLine();
        }

        $failed = collect($rows)->where('status', 'fail');

        if ($failed->isNotEmpty()) {
            $this->error('  '.$failed->count().' check(s) failed. Customers are affected by these.');

            return self::FAILURE;
        }

        $this->info('  Ready.');

        return self::SUCCESS;
    }
}
